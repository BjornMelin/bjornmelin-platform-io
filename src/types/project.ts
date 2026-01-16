import type { z } from "zod";
import type { projectSchema } from "@/lib/schemas/project";

export type Project = z.infer<typeof projectSchema>;

export interface ProjectFilterState {
  category: string;
  sortBy: "featured" | "alphabetical";
}
