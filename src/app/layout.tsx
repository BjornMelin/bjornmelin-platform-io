import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import StructuredData from "@/components/structured-data";
import { ThemeScript } from "@/components/theme";
import { PROFILE } from "@/lib/profile";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://bjornmelin.io"),
  title: {
    template: `%s | ${PROFILE.name}`,
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <StructuredData type="both" />
      </body>
    </html>
  );
}
