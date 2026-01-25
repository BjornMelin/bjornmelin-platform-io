import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import StructuredData from "@/components/structured-data";
import { ThemeScript } from "@/components/theme";
import { PROFILE } from "@/lib/profile";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

/** Enforces static rendering for the root layout. */
export const dynamic = "error";

/** Defines the default viewport configuration. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

/** Defines site-wide metadata for SEO and social sharing. */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://bjornmelin.com"),
  title: {
    template: "%s | Bjorn Melin",
    default: `${PROFILE.name} - ${PROFILE.shortTitle}`,
  },
  description: PROFILE.summary,
  icons: {
    icon: "/headshot/headshot-2024.jpg",
    apple: "/headshot/headshot-2024.jpg",
  },
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
  keywords: PROFILE.keywords,
  authors: [{ name: "Bjorn Melin" }],
  creator: "Bjorn Melin",
};

/**
 * Renders the root layout with providers and shell.
 * @param children - Page content to render inside the app shell.
 * @returns Root layout element.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <StructuredData type="both" />
      </body>
    </html>
  );
}
