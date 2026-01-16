import { z } from "zod";

export const projectLinksSchema = z
  .strictObject({
    github: z.url().optional(),
    live: z.url().optional(),
    demo: z.url().optional(),
  })
  .refine((links) => Boolean(links.github || links.live || links.demo), {
    error: "At least one project link must be provided",
  });

export const projectSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string().min(1)).min(1),
  category: z.string().min(1),
  image: z.string().min(1),
  links: projectLinksSchema,
  featured: z.boolean().optional(),
});

export const projectsSchema = z.array(projectSchema);

export type Project = z.infer<typeof projectSchema>;
export type Projects = z.infer<typeof projectsSchema>;
