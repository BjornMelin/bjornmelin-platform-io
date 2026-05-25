/** UI-ready project card data derived from the generated projects source. */
export type ProjectCardModel = {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  primaryUrl: string;
  liveUrl?: string;
  docsUrl?: string;

  stars: number;
  forks: number;
  watchers?: number;
  commitCount?: number;
  openPullRequests?: number;
  latestRelease?: {
    tagName: string;
    name?: string;
    url: string;
    published: string;
    publishedLabel: string;
  };
  language?: string;
  license?: string;

  updatedAt: string;
  updatedLabel: string;

  topics: string[];
  tags: string[];

  category: string;
  featured: boolean;

  highlights?: string[];
};
