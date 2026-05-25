/**
 * Per-project override flags for featured status, URLs, and visibility.
 */
export type ProjectOverride = {
  featured?: boolean;
  rank?: number;
  primaryUrlOverride?: string;
  liveUrl?: string;
  docsUrl?: string;
  highlights?: string[];
  categoryOverride?: string;
  hide?: boolean;
};

/** Manual overrides keyed by project id. */
export const projectOverrides: Record<string, ProjectOverride> = {
  "bjornmelin-platform-io": {
    featured: true,
    primaryUrlOverride: "https://bjornmelin.io",
    liveUrl: "https://bjornmelin.io",
    highlights: [
      "Strict static export to S3/CloudFront with CSP hash automation",
      "AWS CDK infrastructure and deployment automation",
    ],
  },
  stardex: {
    featured: true,
    primaryUrlOverride: "https://stardex.bjornmelin.io",
    liveUrl: "https://stardex.bjornmelin.io",
    highlights: ["Search + cluster GitHub stars", "AI-powered exploration of starred repos"],
  },
  "docmind-ai-llm": {
    featured: true,
    highlights: [
      "Offline-first operation with zero cloud dependency",
      "5-agent LangGraph supervisor orchestration",
    ],
  },
  "polyagent-research-intelligence": {
    highlights: ["Modular multi-agent research orchestration", "Report generation pipeline"],
  },
};
