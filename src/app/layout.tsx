import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import StructuredData from "@/components/structured-data";
import { ThemeScript } from "@/components/theme";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://bjornmelin.com"),
  title: {
    template: "%s | Bjorn Melin",
    default: "Bjorn Melin - Senior Data Scientist & Cloud Solutions Architect",
  },
  description:
    "Senior Data Scientist and Cloud Solutions Architect specializing in AI/ML, GenAI innovation, cloud architecture, and modern development.",
  icons: {
    icon: "/headshot/headshot-2024.jpg",
    apple: "/headshot/headshot-2024.jpg",
  },
  openGraph: {
    type: "website",
    title: "Bjorn Melin - Senior Data Scientist & Cloud Solutions Architect",
    description:
      "Senior Data Scientist and Cloud Solutions Architect specializing in AI/ML, GenAI innovation, cloud architecture, and modern development.",
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
      "Senior Data Scientist and Cloud Solutions Architect specializing in AI/ML, GenAI innovation, cloud architecture, and modern development.",
    images: ["/screenshots/hero-preview.png"],
  },
  keywords: [
    "Neuro-symbolic AI",
    "Deep Learning",
    "Reinforcement Learning",
    "Machine Learning",
    "AWS Machine Learning Engineer",
    "AWS Solutions Architect",
    "AWS SysOps Administrator",
    "AWS Developer",
    "AWS AI Practitioner",
    "Cloud Architecture",
    "MLOps",
    "Data Science",
    "Python",
    "Java",
    "TypeScript",
    "FastAPI",
    "Next.js",
    "React",
    "Neural Networks",
    "TensorFlow",
    "PyTorch",
    "LangChain",
    "CloudFormation",
    "Kubernetes",
    "Docker",
    "CI/CD",
    "GitHub Actions",
    "Vector Databases",
    "Statistical Modeling",
    "Clustering Algorithms",
    "PCA",
    "Feature Engineering",
    "Databricks",
    "AWS SageMaker",
    "Generative AI",
    "Large Language Models",
    "Serverless",
    "Innovation",
    "Node.js",
    "Full-Stack Development",
    "Cloud Computing",
  ],
  authors: [{ name: "Bjorn Melin" }],
  creator: "Bjorn Melin",
};

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
