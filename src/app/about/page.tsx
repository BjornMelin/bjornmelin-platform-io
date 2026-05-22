import type { Metadata } from "next";
import { AboutDetail } from "@/components/sections/about-detail";
import { sharedOpenGraphImage } from "@/lib/metadata";
import { PROFILE } from "@/lib/profile";

/** Page metadata definition. */
export const metadata: Metadata = {
  title: "About",
  description: PROFILE.summary,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    url: "/about",
    title: `About - ${PROFILE.name} | ${PROFILE.shortTitle}`,
    description: PROFILE.summary,
    images: [sharedOpenGraphImage],
  },
};

/**
 * Renders the about page.
 * @returns About page element.
 */
export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AboutDetail />
    </div>
  );
}
