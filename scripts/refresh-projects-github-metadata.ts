#!/usr/bin/env tsx
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const DEFAULT_OWNER = "BjornMelin";
const DEFAULT_MIN_STARS = 5;
const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_FETCH_TIMEOUT_MS = 15_000;
const DISCOVERED_SUMMARY_PLACEHOLDER =
  "GitHub repository metadata discovered during the automated projects refresh.";

type JsonObject = Record<string, unknown>;

/** GitHub repository owner/name pair parsed from a repository URL. */
export type GitHubRepositoryRef = {
  owner: string;
  repo: string;
};

/** Latest published GitHub release metadata stored in generated projects data. */
export type LatestReleaseMetadata = {
  tagName: string;
  name?: string;
  url: string;
  published: string;
};

/** GitHub-derived metrics used to refresh a generated project entry. */
export type GitHubProjectMetrics = {
  name: string;
  url: string;
  stars: number;
  forks: number;
  watchers: number;
  license: string | null;
  language: string | null;
  created: string;
  updated: string;
  description?: string;
  homepage?: string;
  topics: string[];
  defaultBranch: string;
  commitCount: number;
  openPullRequests: number;
  latestRelease?: LatestReleaseMetadata;
};

/** Partial GitHub REST repository response consumed by the refresh script. */
export type GitHubRepositoryResponse = {
  name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  license: { spdx_id?: string | null; name?: string | null } | null;
  language: string | null;
  created_at: string;
  pushed_at: string | null;
  updated_at: string;
  topics?: string[];
  default_branch: string;
  private?: boolean;
  fork?: boolean;
};

/** GitHub repository listing entry used as the seed for per-repository metrics. */
export type GitHubRepositorySeed = GitHubRepositoryRef & {
  repository: GitHubRepositoryResponse;
};

type GitHubReleaseResponse = {
  tag_name: string;
  name: string | null;
  html_url: string;
  published_at: string | null;
  created_at: string;
};

type GitHubApiResult<T> = {
  data: T;
  headers: Headers;
};

type ProjectsDocument = JsonObject & {
  metadata?: JsonObject;
  projects?: JsonObject[];
  statistics?: JsonObject;
};

type RefreshCliOptions = {
  check: boolean;
  dryRun: boolean;
  allowUnauthenticated: boolean;
  generatedDate?: string;
  filePath: string;
  owner: string;
  minStars: number;
};

/**
 * Parse an HTTPS GitHub repository URL into an owner and repository name.
 *
 * @param repositoryUrl - Repository URL to parse.
 * @returns Parsed owner/repo pair, or null when the URL is not a GitHub repository URL.
 */
export function parseGitHubRepositoryUrl(repositoryUrl: string): GitHubRepositoryRef | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(repositoryUrl);
  } catch {
    return null;
  }

  if (parsedUrl.hostname.toLowerCase() !== "github.com") {
    return null;
  }

  const [owner, rawRepo] = parsedUrl.pathname.split("/").filter(Boolean);
  if (!owner || !rawRepo) {
    return null;
  }

  const repo = rawRepo.endsWith(".git") ? rawRepo.slice(0, -4) : rawRepo;
  if (!repo) {
    return null;
  }

  return { owner, repo };
}

/**
 * Convert a GitHub ISO timestamp to the date-only format used by projects JSON.
 *
 * @param value - ISO timestamp or empty value from GitHub.
 * @returns Date-only string, or undefined when the input cannot be parsed.
 */
export function toDateOnly(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Return the total item count represented by a one-item paginated GitHub response.
 *
 * @param linkHeader - GitHub Link header from a paginated response.
 * @param currentPageItemCount - Number of items returned on the current page.
 * @returns Total item count inferred from the last page relation.
 */
export function getPaginationTotal(
  linkHeader: string | null,
  currentPageItemCount: number,
): number {
  if (!linkHeader) {
    return currentPageItemCount;
  }

  const lastPageMatch = /[?&]page=(\d+)[^>]*>\s*;\s*rel="last"/.exec(linkHeader);
  if (!lastPageMatch) {
    return currentPageItemCount;
  }

  const lastPage = Number.parseInt(lastPageMatch[1] ?? "", 10);
  return Number.isFinite(lastPage) ? lastPage : currentPageItemCount;
}

/**
 * Apply GitHub metrics to one generated project while preserving curated fields.
 *
 * @param project - Existing generated project object.
 * @param metrics - Current GitHub metrics for the same repository.
 * @returns Refreshed generated project object.
 */
export function applyGitHubProjectMetrics(
  project: JsonObject,
  metrics: GitHubProjectMetrics,
): JsonObject {
  const nextProject: JsonObject = { ...project };
  if (nextProject.summary === DISCOVERED_SUMMARY_PLACEHOLDER) {
    delete nextProject.summary;
  }
  nextProject.name = metrics.name;
  nextProject.url = metrics.url;
  nextProject.stars = metrics.stars;
  nextProject.forks = metrics.forks;
  nextProject.watchers = metrics.watchers;
  nextProject.license = metrics.license;
  nextProject.language = metrics.language;
  nextProject.created = metrics.created;
  nextProject.updated = metrics.updated;
  nextProject.defaultBranch = metrics.defaultBranch;
  nextProject.commitCount = metrics.commitCount;
  nextProject.openPullRequests = metrics.openPullRequests;
  nextProject.topics = metrics.topics;

  if (metrics.description) {
    nextProject.description = metrics.description;
  } else {
    delete nextProject.description;
  }
  if (metrics.homepage) {
    nextProject.homepage = metrics.homepage;
  } else {
    delete nextProject.homepage;
  }
  if (metrics.latestRelease) {
    nextProject.latestRelease = metrics.latestRelease;
  } else {
    delete nextProject.latestRelease;
  }

  return nextProject;
}

/**
 * Compute aggregate statistics for the generated projects document.
 *
 * @param projects - Generated project objects.
 * @returns Aggregate statistics object for the generated document.
 */
export function computeProjectsStatistics(projects: JsonObject[]): JsonObject {
  const numberOfProjects = projects.length;
  const totalStars = projects.reduce(
    (sum, project) => sum + readNonnegativeInteger(project.stars),
    0,
  );
  const averageStars = roundTo(totalStars / Math.max(1, numberOfProjects), 2);

  const licenseDistribution: Record<string, number> = {};
  const languageDistribution: Record<string, number> = {};

  for (const project of projects) {
    const licenseKey =
      project.license == null ? "unlicensed" : String(project.license).toLowerCase();
    licenseDistribution[licenseKey] = (licenseDistribution[licenseKey] ?? 0) + 1;

    const languageKey =
      typeof project.language === "string" ? project.language.toLowerCase() : "unknown";
    languageDistribution[languageKey] = (languageDistribution[languageKey] ?? 0) + 1;
  }

  const topRepositories = [...projects]
    .sort((a, b) => {
      const delta = readNonnegativeInteger(b.stars) - readNonnegativeInteger(a.stars);
      if (delta !== 0) return delta;
      return String(a.name).localeCompare(String(b.name));
    })
    .slice(0, 5)
    .map((project) => `${String(project.name)} (${readNonnegativeInteger(project.stars)} stars)`);

  return {
    totalStars,
    averageStars,
    numberOfProjects,
    topRepositories,
    languageDistribution,
    licenseDistribution,
  };
}

/**
 * Refresh an in-memory projects document with deterministic GitHub metrics.
 *
 * @param document - Existing generated projects document.
 * @param options - Refresh settings and GitHub data access functions.
 * @returns Refreshed projects document.
 * @throws Error - When repository discovery or metrics fetching fails.
 */
export async function refreshProjectsDocument(
  document: ProjectsDocument,
  options: {
    generatedDate: string;
    owner: string;
    minStars: number;
    fetchMetrics: (seed: GitHubRepositorySeed) => Promise<GitHubProjectMetrics>;
    listRepositories: (owner: string, minStars: number) => Promise<GitHubRepositorySeed[]>;
  },
): Promise<ProjectsDocument> {
  const existingProjects = Array.isArray(document.projects) ? document.projects : [];
  const projectsById = new Map<string, JsonObject>();
  for (const project of existingProjects) {
    if (typeof project.id === "string") {
      projectsById.set(project.id, project);
    }
  }

  const repositorySeeds = await options.listRepositories(options.owner, options.minStars);
  const seedsById = new Map(repositorySeeds.map((seed) => [seed.repo, seed]));
  const refreshedProjectIds = new Set<string>();
  const refreshedProjects: JsonObject[] = [];
  const existingRefreshes: Promise<JsonObject | null>[] = [];

  for (const existingProject of existingProjects) {
    const id = typeof existingProject.id === "string" ? existingProject.id : undefined;
    if (!id) {
      continue;
    }
    const seed = seedsById.get(id);
    if (!seed) {
      continue;
    }
    refreshedProjectIds.add(id);
    existingRefreshes.push(
      refreshProjectFromSeed(existingProject, seed, options.minStars, options.fetchMetrics),
    );
  }

  for (const project of await Promise.all(existingRefreshes)) {
    if (project) {
      refreshedProjects.push(project);
    }
  }

  const discoveredRefreshes: Promise<JsonObject | null>[] = [];
  for (const seed of repositorySeeds) {
    if (refreshedProjectIds.has(seed.repo)) {
      continue;
    }
    const id = seed.repo;
    const existingProject = projectsById.get(id) ?? buildDiscoveredProject(seed);
    discoveredRefreshes.push(
      refreshProjectFromSeed(existingProject, seed, options.minStars, options.fetchMetrics),
    );
  }

  for (const project of await Promise.all(discoveredRefreshes)) {
    if (project) {
      refreshedProjects.push(project);
    }
  }

  const statistics = {
    ...(document.statistics ?? {}),
    ...computeProjectsStatistics(refreshedProjects),
  };

  return {
    ...document,
    metadata: {
      ...(document.metadata ?? {}),
      generated: options.generatedDate,
      totalRepositories: refreshedProjects.length,
      source:
        "GitHub REST API repository discovery and metrics refresh plus curated repository documentation analysis",
      updateFrequency: "Weekly via GitHub Actions or manually as needed",
    },
    projects: refreshedProjects,
    statistics,
  };
}

async function refreshProjectFromSeed(
  project: JsonObject,
  seed: GitHubRepositorySeed,
  minStars: number,
  fetchMetrics: (seed: GitHubRepositorySeed) => Promise<GitHubProjectMetrics>,
): Promise<JsonObject | null> {
  const metrics = await fetchMetrics(seed);
  if (metrics.stars < minStars) {
    return null;
  }

  return applyGitHubProjectMetrics(project, metrics);
}

function readNonnegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;
}

function roundTo(number: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(number * factor) / factor;
}

function buildDiscoveredProject(ref: GitHubRepositoryRef): JsonObject {
  return {
    id: ref.repo,
    name: ref.repo,
    url: `https://github.com/${ref.owner}/${ref.repo}`,
  };
}

function buildGitHubHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "bjornmelin-platform-io-project-refresh",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function buildRateLimitMessage(headers: Headers): string {
  const remaining = headers.get("x-ratelimit-remaining");
  if (remaining !== "0") {
    return "";
  }

  const reset = headers.get("x-ratelimit-reset");
  if (!reset) {
    return " GitHub rate limit remaining is 0.";
  }

  const resetAt = new Date(Number.parseInt(reset, 10) * 1000).toISOString();
  return ` GitHub rate limit remaining is 0 until ${resetAt}.`;
}

async function fetchGitHubJson<T>(
  pathName: string,
  token: string | undefined,
  options: { allowNotFound?: boolean } = {},
): Promise<GitHubApiResult<T> | null> {
  const response = await fetch(`${GITHUB_API_BASE_URL}${pathName}`, {
    headers: buildGitHubHeaders(token),
    signal: AbortSignal.timeout(GITHUB_FETCH_TIMEOUT_MS),
  });
  const responseText = await response.text();

  if (response.status === 404 && options.allowNotFound) {
    return null;
  }

  if (!response.ok) {
    const parsedMessage = parseGitHubErrorMessage(responseText);
    throw new Error(
      `GitHub API request failed for ${pathName}: ${response.status} ${response.statusText}.${buildRateLimitMessage(
        response.headers,
      )}${parsedMessage ? ` ${parsedMessage}` : ""}`,
    );
  }

  return {
    data: responseText ? (JSON.parse(responseText) as T) : (null as T),
    headers: response.headers,
  };
}

function parseGitHubErrorMessage(responseText: string): string | undefined {
  if (!responseText.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(responseText) as { message?: unknown };
    return typeof parsed.message === "string" ? parsed.message : undefined;
  } catch {
    return responseText.slice(0, 300);
  }
}

async function fetchAllUserRepositories(
  owner: string,
  token: string | undefined,
  minStars: number,
): Promise<GitHubRepositorySeed[]> {
  const repositories: GitHubRepositorySeed[] = [];
  let page = 1;
  while (true) {
    const result = await fetchGitHubJson<GitHubRepositoryResponse[]>(
      `/users/${encodeURIComponent(owner)}/repos?type=owner&sort=pushed&direction=desc&per_page=100&page=${page}`,
      token,
    );
    if (!result) {
      break;
    }

    for (const repository of result.data) {
      if (repository.private || repository.fork || repository.stargazers_count < minStars) {
        continue;
      }
      repositories.push({ owner, repo: repository.name, repository });
    }

    if (!result.headers.get("link")?.includes('rel="next"')) {
      break;
    }
    page += 1;
  }

  return repositories;
}

async function fetchCount(pathName: string, token: string | undefined): Promise<number> {
  const result = await fetchGitHubJson<unknown[]>(pathName, token);
  if (!result) {
    return 0;
  }

  return getPaginationTotal(
    result.headers.get("link"),
    Array.isArray(result.data) ? result.data.length : 0,
  );
}

async function fetchProjectMetrics(
  seed: GitHubRepositorySeed,
  token: string | undefined,
): Promise<GitHubProjectMetrics> {
  const owner = encodeURIComponent(seed.owner);
  const repo = encodeURIComponent(seed.repo);
  const repositoryData = seed.repository;
  const [commitCount, openPullRequests, latestReleaseResult] = await Promise.all([
    fetchCount(
      `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(
        repositoryData.default_branch,
      )}&per_page=1`,
      token,
    ),
    fetchCount(`/repos/${owner}/${repo}/pulls?state=open&per_page=1`, token),
    fetchGitHubJson<GitHubReleaseResponse>(`/repos/${owner}/${repo}/releases/latest`, token, {
      allowNotFound: true,
    }),
  ]);

  const latestRelease = latestReleaseResult
    ? buildLatestReleaseMetadata(latestReleaseResult.data)
    : undefined;

  return {
    name: repositoryData.name,
    url: repositoryData.html_url,
    stars: repositoryData.stargazers_count,
    forks: repositoryData.forks_count,
    watchers: repositoryData.watchers_count,
    license: normalizeLicense(repositoryData.license),
    language: repositoryData.language,
    created: toDateOnly(repositoryData.created_at) ?? repositoryData.created_at,
    updated:
      toDateOnly(repositoryData.pushed_at ?? repositoryData.updated_at) ??
      repositoryData.updated_at,
    description: normalizeOptionalString(repositoryData.description),
    homepage: normalizeOptionalString(repositoryData.homepage),
    topics: [...(repositoryData.topics ?? [])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    ),
    defaultBranch: repositoryData.default_branch,
    commitCount,
    openPullRequests,
    latestRelease,
  };
}

function buildLatestReleaseMetadata(release: GitHubReleaseResponse): LatestReleaseMetadata {
  return {
    tagName: release.tag_name,
    name: normalizeOptionalString(release.name),
    url: release.html_url,
    published: toDateOnly(release.published_at ?? release.created_at) ?? release.created_at,
  };
}

function normalizeLicense(license: GitHubRepositoryResponse["license"]): string | null {
  if (!license) {
    return null;
  }

  if (license.spdx_id && license.spdx_id !== "NOASSERTION") {
    return license.spdx_id;
  }

  return normalizeOptionalString(license.name) ?? null;
}

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function defaultProjectsFilePath(): string {
  return path.join(process.cwd(), "src", "content", "projects", "projects.generated.json");
}

function parseCliOptions(argv: string[]): RefreshCliOptions {
  const options: RefreshCliOptions = {
    check: false,
    dryRun: false,
    allowUnauthenticated: false,
    filePath: defaultProjectsFilePath(),
    owner: DEFAULT_OWNER,
    minStars: DEFAULT_MIN_STARS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (argument === "--allow-unauthenticated") {
      options.allowUnauthenticated = true;
      continue;
    }
    if (argument === "--date") {
      index += 1;
      options.generatedDate = readRequiredOptionValue(argv, index, "--date");
      continue;
    }
    if (argument === "--file") {
      index += 1;
      options.filePath = path.resolve(readRequiredOptionValue(argv, index, "--file"));
      continue;
    }
    if (argument === "--owner") {
      index += 1;
      options.owner = readRequiredOptionValue(argv, index, "--owner");
      continue;
    }
    if (argument === "--min-stars") {
      index += 1;
      const rawMinStars = readRequiredOptionValue(argv, index, "--min-stars");
      const minStars = Number.parseInt(rawMinStars, 10);
      if (!Number.isInteger(minStars) || minStars < 0) {
        throw new Error("--min-stars must be a nonnegative integer.");
      }
      options.minStars = minStars;
      continue;
    }
    if (argument === "--help") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  if (options.generatedDate && !/^\d{4}-\d{2}-\d{2}$/.test(options.generatedDate)) {
    throw new Error("--date must be formatted as YYYY-MM-DD.");
  }

  return options;
}

function readRequiredOptionValue(argv: string[], index: number, optionName: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function printHelp(): void {
  console.log(`Usage: pnpm projects:github:refresh [options]

Options:
  --check                  Exit nonzero when GitHub metrics would change the generated file.
  --dry-run                Print the refreshed JSON instead of writing it.
  --allow-unauthenticated  Permit unauthenticated GitHub API calls.
  --date YYYY-MM-DD        Override metadata.generated.
  --file PATH              Override the projects.generated.json path.
  --owner USERNAME         GitHub username to discover public owner repositories from.
  --min-stars COUNT        Minimum stars required for inclusion. Defaults to ${DEFAULT_MIN_STARS}.
  --help                   Show this help text.`);
}

function getGitHubToken(): string | undefined {
  return (
    process.env.PROJECTS_GITHUB_REFRESH_TOKEN ??
    process.env.GH_TOKEN ??
    process.env.GITHUB_TOKEN ??
    undefined
  );
}

function currentDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function listChangedProjects(before: ProjectsDocument, after: ProjectsDocument): string[] {
  const beforeProjects = new Map(
    (before.projects ?? [])
      .filter((project) => typeof project.id === "string")
      .map((project) => [String(project.id), project]),
  );

  const changed = [];
  for (const project of after.projects ?? []) {
    const id = typeof project.id === "string" ? project.id : String(project.name ?? "unknown");
    const beforeProject = beforeProjects.get(id);
    if (!beforeProject || !isDeepStrictEqual(beforeProject, project)) {
      changed.push(id);
    }
  }

  return changed.sort((a, b) => a.localeCompare(b));
}

/**
 * Run the GitHub projects refresh CLI.
 *
 * @param argv - CLI arguments without the executable and script path.
 * @returns Promise that resolves after the refresh, check, or dry run completes.
 * @throws Error - When CLI options, file IO, JSON parsing, or GitHub requests fail.
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseCliOptions(argv);
  const token = getGitHubToken();
  if (!token && !options.allowUnauthenticated) {
    throw new Error(
      "Set PROJECTS_GITHUB_REFRESH_TOKEN, GH_TOKEN, or GITHUB_TOKEN, or pass --allow-unauthenticated.",
    );
  }

  const rawDocument = await readFile(options.filePath, "utf8");
  const document = JSON.parse(rawDocument) as ProjectsDocument;
  const generatedDate =
    options.generatedDate ??
    (options.check && typeof document.metadata?.generated === "string"
      ? document.metadata.generated
      : currentDateOnly());

  const refreshedDocument = await refreshProjectsDocument(document, {
    generatedDate,
    owner: options.owner,
    minStars: options.minStars,
    fetchMetrics: (seed) => fetchProjectMetrics(seed, token),
    listRepositories: (owner, minStars) => fetchAllUserRepositories(owner, token, minStars),
  });

  const output = `${JSON.stringify(refreshedDocument, null, 2)}\n`;
  if (options.dryRun) {
    process.stdout.write(output);
    return;
  }

  if (options.check) {
    if (isDeepStrictEqual(document, refreshedDocument)) {
      console.log("projects.generated.json is up to date with GitHub metadata.");
      return;
    }

    const changedProjects = listChangedProjects(document, refreshedDocument);
    console.error("projects.generated.json is out of date with GitHub metadata.");
    console.error(`Changed projects: ${changedProjects.join(", ") || "metadata/statistics only"}`);
    process.exitCode = 1;
    return;
  }

  await writeFile(options.filePath, output, "utf8");
  console.log(
    `Refreshed ${refreshedDocument.projects?.length ?? 0} projects from GitHub metadata.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
