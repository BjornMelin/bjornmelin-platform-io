import { projectsSchema } from "@/lib/schemas/project";

export const projectsData = projectsSchema.parse([
  {
    id: "1",
    title: "Stardex - Explore GitHub Stars Intelligently",
    description:
      "🌟 Stardex: Explore GitHub Stars Intelligently. Stardex is a powerful web app that lets you search, " +
      "filter, and cluster any GitHub user's starred repositories. Discover hidden patterns and find your next " +
      "favorite project with intelligent, AI-powered exploration.",
    image: "/projects/stardex.png",
    technologies: [
      "Next.js",
      "Python",
      "FastAPI",
      "Machine Learning",
      "AWS Lambda",
      "Clustering",
      "AWS S3",
      "Sklearn",
      "PCA",
      "Hierarchical Clustering",
      "K-means Clusering",
      "AWS API Gateway",
      "tailwindcss",
      "AWS CDK",
      "Text Embeddings",
    ],
    category: "AI & Machine Learning",
    links: {
      github: "https://github.com/BjornMelin/stardex",
      live: "https://stardex.bjornmelin.io",
    },
    featured: true,
  },
  {
    id: "2",
    title: "PolyAgent Research Intelligence",
    description:
      "A modular, multi-agent AI research and report generation platform. Enter any topic, and " +
      "PolyAgent Research Intelligence orchestrates multiple AI agents to retrieve literature, " +
      "analyze data, and generate a polished report. Built for researchers and AI/ML engineers, " +
      "leveraging LangChain, FastAPI, PostgreSQL, advanced LLMs, and a Next.js front-end.",
    image: "/projects/polyagent-research.png",
    technologies: [
      "Machine Learning",
      "AI",
      "Next.js",
      "Grafana",
      "Prometheus",
      "Multi-Agent Systems",
      "AI Research",
      "Agentic AI",
      "LangChain",
      "FastAPI",
      "Large Language Models",
      "AI Engineering",
      "OpenRouter",
      "FAISS Vector Database",
      "tailwindcss",
    ],
    category: "AI & Machine Learning",
    links: {
      github: "https://github.com/BjornMelin/polyagent-research-intelligence",
    },
    featured: true,
  },
  {
    id: "3",
    title: "AIScout",
    description:
      "Real-time AI/ML content aggregator and discovery platform. Automatically curates cutting-edge research papers, repositories, articles, and discussions about artificial intelligence, machine learning, and LLMs. Built with React, Python, and AWS.",
    image: "/projects/ai-scout.png",
    technologies: [
      "React",
      "Real-Time",
      "AI",
      "ML",
      "Technology",
      "AI-Research",
      "Content-Discovery",
      "Postcss",
      "Zod",
      "Zustand",
      "TailwindCSS",
      "Shadcn",
      "Next.js",
    ],
    category: "Web Development",
    links: {
      github: "https://github.com/BjornMelin/aiscout-frontend",
      //   demo: 'https://demo.example.com',
    },
    featured: true,
  },
  {
    id: "4",
    title: "Portfolio Website",
    description: "A modern portfolio website built with Next.js and AWS services.",
    image: "/projects/portfolio.png",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "AWS"],
    category: "Web Development",
    links: {
      github: "https://github.com/bjornmelin/bjornmelin-platform-io",
      live: "https://bjornmelin.io",
    },
    featured: false,
  },
  {
    id: "5",
    title: "PDFusion",
    description:
      "A lightweight Python utility for effortlessly merging multiple PDF files into a single document.",
    image: "/projects/pdfusion.png",
    technologies: [
      "Python",
      "CLI",
      "PDF",
      "Automation",
      "Utilities",
      "Python-Library",
      "File-Management",
      "Command-Line-Tool",
      "Document-Management",
      "Batch-Processing",
      "Pypdf2",
      "PDF-Manipulation",
      "PDF-Merger",
      "Document-Processing",
      "PDF-Tools",
    ],
    category: "AI & Machine Learning",
    links: {
      github: "https://github.com/BjornMelin/pdfusion",
    },
    featured: false,
  },
]);
