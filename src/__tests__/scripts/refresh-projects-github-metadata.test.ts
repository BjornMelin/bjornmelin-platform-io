/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  applyGitHubProjectMetrics,
  type GitHubProjectMetrics,
  type GitHubRepositoryResponse,
  type GitHubRepositorySeed,
  getPaginationTotal,
  parseGitHubRepositoryUrl,
  refreshProjectsDocument,
  toDateOnly,
} from "../../../scripts/refresh-projects-github-metadata";

const repositoryResponse: GitHubRepositoryResponse = {
  name: "project-alpha",
  html_url: "https://github.com/example/project-alpha",
  description: "Repository description",
  homepage: "",
  stargazers_count: 50,
  forks_count: 5,
  watchers_count: 50,
  license: { spdx_id: "MIT" },
  language: "TypeScript",
  created_at: "2024-01-01T00:00:00Z",
  pushed_at: "2026-05-20T12:34:56Z",
  updated_at: "2026-05-21T12:34:56Z",
  topics: ["typescript", "nextjs"],
  default_branch: "main",
  private: false,
  fork: false,
};

function buildMetrics(seed: GitHubRepositorySeed): GitHubProjectMetrics {
  return {
    name: seed.repository.name,
    url: seed.repository.html_url,
    stars: seed.repository.stargazers_count,
    forks: seed.repository.forks_count,
    watchers: seed.repository.watchers_count,
    license: seed.repository.license?.spdx_id ?? null,
    language: seed.repository.language,
    created: "2024-01-01",
    updated: "2026-05-20",
    description: seed.repository.description ?? undefined,
    topics: seed.repository.topics ?? [],
    defaultBranch: seed.repository.default_branch,
    commitCount: 321,
    openPullRequests: 2,
    latestRelease: {
      tagName: "v1.2.3",
      name: "v1.2.3",
      url: "https://github.com/example/project-alpha/releases/tag/v1.2.3",
      published: "2026-05-01",
    },
  };
}

describe("refresh projects GitHub metadata", () => {
  it("parses GitHub repository URLs", () => {
    expect(parseGitHubRepositoryUrl("https://github.com/BjornMelin/example.git")).toEqual({
      owner: "BjornMelin",
      repo: "example",
    });
    expect(parseGitHubRepositoryUrl("https://example.com/BjornMelin/example")).toBeNull();
  });

  it("normalizes GitHub timestamps to date-only values", () => {
    expect(toDateOnly("2026-05-20T12:34:56Z")).toBe("2026-05-20");
    expect(toDateOnly("not-a-date")).toBeUndefined();
  });

  it("reads total counts from GitHub pagination headers", () => {
    expect(
      getPaginationTotal(
        '<https://api.github.com/repositories/1/commits?per_page=1&page=2>; rel="next", <https://api.github.com/repositories/1/commits?per_page=1&page=42>; rel="last"',
        1,
      ),
    ).toBe(42);
    expect(getPaginationTotal(null, 1)).toBe(1);
  });

  it("applies metrics without replacing curated summary fields", () => {
    const refreshed = applyGitHubProjectMetrics(
      { id: "project-alpha", summary: "Curated summary" },
      buildMetrics({ owner: "example", repo: "project-alpha", repository: repositoryResponse }),
    );

    expect(refreshed).toEqual(
      expect.objectContaining({
        summary: "Curated summary",
        commitCount: 321,
        openPullRequests: 2,
        defaultBranch: "main",
        latestRelease: expect.objectContaining({ tagName: "v1.2.3" }),
      }),
    );
  });

  it("removes stale optional GitHub fields when current metrics omit them", () => {
    const metrics = buildMetrics({
      owner: "example",
      repo: "project-alpha",
      repository: { ...repositoryResponse, description: null, homepage: null },
    });
    const refreshed = applyGitHubProjectMetrics(
      {
        id: "project-alpha",
        description: "Old description",
        homepage: "https://example.com/old",
        latestRelease: { tagName: "old", url: "https://example.com/old", published: "2026-01-01" },
      },
      { ...metrics, latestRelease: undefined },
    );

    expect(refreshed).not.toHaveProperty("description");
    expect(refreshed).not.toHaveProperty("homepage");
    expect(refreshed).not.toHaveProperty("latestRelease");
  });

  it("refreshes discovered repositories and recomputes statistics", async () => {
    const document = {
      metadata: {
        generated: "2026-01-01",
        totalRepositories: 1,
        description: "Test data",
      },
      projects: [
        {
          id: "project-alpha",
          name: "project-alpha",
          url: "https://github.com/example/project-alpha",
          stars: 1,
          forks: 0,
          updated: "2026-01-01",
          topics: [],
          summary: "Curated summary",
        },
      ],
      statistics: {
        topicClusters: {
          web: ["project-alpha"],
        },
      },
    };

    const refreshed = await refreshProjectsDocument(document, {
      generatedDate: "2026-05-25",
      owner: "example",
      minStars: 5,
      listRepositories: async () => [
        { owner: "example", repo: "project-alpha", repository: repositoryResponse },
      ],
      fetchMetrics: async (seed) => buildMetrics(seed),
    });

    expect(refreshed.metadata).toEqual(
      expect.objectContaining({
        generated: "2026-05-25",
        totalRepositories: 1,
        updateFrequency: "Weekly via GitHub Actions or manually as needed",
      }),
    );
    expect(refreshed.projects).toEqual([
      expect.objectContaining({
        id: "project-alpha",
        stars: 50,
        commitCount: 321,
        openPullRequests: 2,
        summary: "Curated summary",
      }),
    ]);
    expect(refreshed.statistics).toEqual(
      expect.objectContaining({
        totalStars: 50,
        averageStars: 50,
        numberOfProjects: 1,
        topicClusters: { web: ["project-alpha"] },
      }),
    );
  });
});
