import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://bjornmelin.com";

  // Static routes
  const routes = ["", "/blog", "/projects", "/about", "/contact"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString(),
      changeFrequency: route === "/blog" ? "daily" : ("weekly" as const),
      priority: route === "" ? 1 : 0.8,
    })
  );

  // Add dynamic routes (e.g., blog posts)
  // const posts = await getPosts();
  // const blogRoutes = posts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }));

  return [...routes];
}
