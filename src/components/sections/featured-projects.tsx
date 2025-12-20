import Link from "next/link";
import { projectsData } from "@/data/projects";
import { ProjectCard } from "../projects/project-card";
import { SectionHeader } from "../shared/section-header";

export function FeaturedProjects() {
  const featuredProjects = projectsData.filter((project) => project.featured);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Featured Projects"
          description="A selection of my recent work in cloud architecture and full-stack development"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {featuredProjects.map((project) => (
            <div key={project.id} className="h-full">
              <ProjectCard project={project} className="h-full flex flex-col" />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/projects"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            View All Projects
          </Link>
        </div>
      </div>
    </section>
  );
}
