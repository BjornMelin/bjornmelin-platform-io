import { type Metadata } from "next";
import { BlogList } from "@/components/blog/blog-list";

export const metadata: Metadata = {
  title: "Blog - Bjorn Melin",
  description: "Thoughts on cloud architecture, AI/ML, and modern development",
  openGraph: {
    title: "Blog - Bjorn Melin",
    description: "Thoughts on cloud architecture, AI/ML, and modern development",
    type: "website",
    url: "https://bjornmelin.com/blog",
  },
};

export default function BlogPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <BlogList />
    </main>
  );
} 