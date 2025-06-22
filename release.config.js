/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
  branches: [
    "main",
    {
      name: "beta",
      prerelease: true,
    },
    {
      name: "alpha",
      prerelease: true,
    },
  ],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "refactor", release: "patch" },
          { type: "docs", scope: "README", release: "patch" },
          { type: "chore", release: false },
          { type: "style", release: false },
          { type: "test", release: false },
          { type: "ci", release: false },
          { type: "build", release: false },
          { breaking: true, release: "major" },
          { revert: true, release: "patch" },
        ],
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
        },
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "✨ Features", hidden: false },
            { type: "fix", section: "🐛 Bug Fixes", hidden: false },
            { type: "perf", section: "⚡ Performance Improvements", hidden: false },
            { type: "refactor", section: "♻️ Code Refactoring", hidden: false },
            { type: "docs", section: "📝 Documentation", hidden: false },
            { type: "style", section: "💄 Styles", hidden: true },
            { type: "test", section: "✅ Tests", hidden: true },
            { type: "build", section: "📦 Build System", hidden: true },
            { type: "ci", section: "🎡 Continuous Integration", hidden: true },
            { type: "chore", section: "🔧 Miscellaneous Chores", hidden: true },
            { type: "revert", section: "⏪ Reverts", hidden: false },
          ],
        },
        writerOpts: {
          commitsSort: ["subject", "scope"],
        },
      },
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
        changelogTitle:
          "# Changelog\n\nAll notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.",
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
        tarballDir: "dist",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "pnpm-lock.yaml"],
        // biome-ignore lint/suspicious/noTemplateCurlyInString: semantic-release expects these placeholders
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/github",
      {
        successComment: false,
        failComment: false,
        releasedLabels: ["released on @<%= nextRelease.channel %>", "released"],
      },
    ],
  ],
};
