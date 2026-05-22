import type { Metadata } from "next";
import { PROFILE } from "@/lib/profile";
import { resolveSiteBaseUrl } from "@/lib/site-url";

/** Shared Open Graph image used by portfolio pages. */
export const sharedOpenGraphImage = {
  url: "/screenshots/hero-preview.png",
  width: 1200,
  height: 630,
  alt: "Bjorn Melin - Portfolio Hero Section",
};

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
  const metadataBase = resolveSiteBaseUrl();
  const canonicalPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const resolvedUrl = canonicalPath
    ? new URL(canonicalPath, metadataBase).toString()
    : metadataBase.toString().replace(/\/$/, "");
  const fullTitle = title
    ? `${title} | ${PROFILE.name}`
    : `${PROFILE.name} - ${PROFILE.shortTitle}`;
  const finalDescription = description || PROFILE.summary;

  return {
    title: fullTitle,
    description: finalDescription,
    metadataBase,
    alternates: {
      canonical: resolvedUrl,
    },
    openGraph: {
      title: fullTitle,
      description: finalDescription,
      url: resolvedUrl,
      siteName: PROFILE.name,
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
