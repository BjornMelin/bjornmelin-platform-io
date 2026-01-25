import type { Metadata } from "next";
import { PROFILE } from "@/lib/profile";

interface GenerateMetadataProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}

/**
 * Builds metadata defaults with optional overrides.
 * @param title - Page title override.
 * @param description - Page description override.
 * @param path - Canonical path suffix.
 * @param image - Social preview image path.
 * @returns Metadata object for Next.js.
 */
export function generateMetadata({
  title,
  description,
  path = "",
  image,
}: GenerateMetadataProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://bjornmelin.com";
  const fullTitle = title
    ? `${title} | ${PROFILE.name}`
    : `${PROFILE.name} - ${PROFILE.shortTitle}`;
  const finalDescription = description || PROFILE.summary;

  return {
    title: fullTitle,
    description: finalDescription,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
    openGraph: {
      title: fullTitle,
      description: finalDescription,
      url: `${baseUrl}${path}`,
      siteName: "Bjorn Melin",
      type: "website",
      ...(image && { images: [{ url: image }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: finalDescription,
      ...(image && { images: [image] }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
