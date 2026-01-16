import type { Project as ProjectType } from "@/lib/schemas/project";

export type Project = ProjectType;

export interface ProjectFilterState {
  category: string;
  sortBy: "featured" | "alphabetical";
}
