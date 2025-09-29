import type { Metadata } from "next";

interface GenerateMetadataProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}

export function generateMetadata({
  title,
  description,
  path = "",
  image,
}: GenerateMetadataProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://bjornmelin.com";
  const fullTitle = title
    ? `${title} | Bjorn Melin`
    : "Bjorn Melin - AWS Solutions Architect & Full Stack Developer";

  return {
    title: fullTitle,
    description:
      description ||
      "AWS Solutions Architect and Full Stack Developer specializing in cloud architecture, serverless computing, and modern web development.",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: `${baseUrl}${path}`,
      siteName: "Bjorn Melin",
      type: "website",
      ...(image && { images: [{ url: image }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
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
