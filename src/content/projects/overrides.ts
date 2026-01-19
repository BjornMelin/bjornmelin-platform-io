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
  "polyagent-research-intelligence": {
    featured: true,
    highlights: ["Modular multi-agent research orchestration", "Report generation pipeline"],
  },
};
