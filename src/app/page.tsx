import type { Metadata } from "next";
import { About } from "@/components/sections/about";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { Hero } from "@/components/sections/hero";
import { PROFILE } from "@/lib/profile";

/** Page metadata definition. */
export const metadata: Metadata = {
  title: `${PROFILE.name} - ${PROFILE.shortTitle}`,
  description: PROFILE.summary,
  openGraph: {
    type: "website",
    title: `${PROFILE.name} - ${PROFILE.shortTitle}`,
    description: PROFILE.summary,
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
    title: `${PROFILE.name} - ${PROFILE.shortTitle}`,
    description: PROFILE.summary,
    images: ["/screenshots/hero-preview.png"],
  },
};

/**
 * Renders the home page.
 * @returns Home page element.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <About />
      <FeaturedProjects />
    </div>
  );
}
