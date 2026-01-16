import type { Metadata } from "next";
import { About } from "@/components/sections/about";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { Hero } from "@/components/sections/hero";

export const metadata: Metadata = {
  title: "Bjorn Melin - Senior Data Scientist & Cloud Solutions Architect",
  description:
    "Portfolio of Bjorn Melin, a Senior Data Scientist and Cloud Solutions Architect specializing in AI/ML solutions, GenAI innovation, and cloud-native architectures. 6x AWS Certified professional with expertise in machine learning and scalable cloud solutions.",
  openGraph: {
    type: "website",
    title: "Bjorn Melin - Senior Data Scientist & Cloud Solutions Architect",
    description:
      "Portfolio of Bjorn Melin, a Senior Data Scientist and Cloud Solutions Architect specializing in AI/ML solutions, GenAI innovation, and cloud-native architectures.",
    images: [
      {
        url: "/screenshots/hero-preview.png",
        width: 1200,
        height: 630,
        alt: "Bjorn Melin - Portfolio Hero Section",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bjorn Melin - Senior Data Scientist & Cloud Solutions Architect",
    description:
      "Portfolio of Bjorn Melin, a Senior Data Scientist and Cloud Solutions Architect specializing in AI/ML solutions, GenAI innovation, and cloud-native architectures.",
    images: ["/screenshots/hero-preview.png"],
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <About />
      <FeaturedProjects />
    </div>
  );
}
