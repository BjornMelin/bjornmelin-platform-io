import type { Metadata } from "next";
import { ProjectGrid } from "@/components/projects/project-grid";
import { projectCategories, projectLanguages, projectsData } from "@/data/projects";

/** Metadata for the projects listing page. */
export const metadata: Metadata = {
  title: "Projects - Bjorn Melin",
  description:
    "Explore my portfolio of projects in machine learning and AI, cloud architecture, and web development.",
};

/**
 * Projects page listing portfolio items.
 *
 * @returns Projects page element.
 */
export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-balance font-heading text-4xl font-bold md:text-6xl">Projects</h1>
        <p className="text-balance text-xl text-muted-foreground">
          A collection of projects showcasing work in machine learning and AI, cloud architecture,
          and web development, along with open source contributions.
        </p>
      </div>
      <div className="mt-16 mx-auto max-w-6xl">
        <h2 className="sr-only">Project List</h2>
        <ProjectGrid
          projects={projectsData}
          categories={projectCategories}
          languages={projectLanguages}
        />
      </div>
    </div>
  );
}
