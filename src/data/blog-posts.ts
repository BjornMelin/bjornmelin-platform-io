export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  author: {
    name: string;
    image: string;
    bio: string;
  };
  coverImage?: string;
  tags: string[];
  readingTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "getting-started-with-nextjs",
    title: "Getting Started with Next.js 14",
    excerpt: "Learn how to build modern web applications with Next.js 14, React Server Components, and TypeScript.",
    content: `
# Getting Started with Next.js 14

Next.js is a powerful framework for building React applications. In this post, we'll explore the key features of Next.js 14 and how to get started with it.

## What's New in Next.js 14

Next.js 14 introduces several exciting features:

- Improved Server Components
- Simplified Data Fetching
- Better Static and Dynamic Rendering
- Enhanced Image Optimization

## Getting Started

First, create a new Next.js project:

\`\`\`bash
npx create-next-app@latest my-app
\`\`\`

## Key Features

### Server Components

Server Components allow you to write React components that run on the server...

### App Router

The new App Router provides a more intuitive way to handle routing...

## Conclusion

Next.js 14 makes it easier than ever to build fast, scalable web applications.
    `,
    publishedAt: "2023-12-01T10:00:00Z",
    updatedAt: "2023-12-01T10:00:00Z",
    author: {
      name: "John Doe",
      image: "/images/authors/john-doe.jpg",
      bio: "Full-stack developer passionate about React and Next.js",
    },
    coverImage: "/images/blog/nextjs-14.jpg",
    tags: ["Next.js", "React", "Web Development"],
    readingTime: "5 min",
  },
  {
    slug: "mastering-typescript",
    title: "Mastering TypeScript: A Comprehensive Guide",
    excerpt: "Everything you need to know about TypeScript to write better, type-safe JavaScript applications.",
    content: `
# Mastering TypeScript

TypeScript is a powerful superset of JavaScript that adds static typing...

## Why TypeScript?

TypeScript provides several benefits:

- Static Typing
- Better IDE Support
- Enhanced Refactoring
- Improved Team Collaboration

## Getting Started

Install TypeScript:

\`\`\`bash
npm install -g typescript
\`\`\`

## Key Concepts

### Type Annotations

TypeScript allows you to add type annotations to your variables...

### Interfaces

Interfaces help you define contracts in your code...

## Conclusion

TypeScript is an essential tool for modern JavaScript development.
    `,
    publishedAt: "2023-12-05T14:30:00Z",
    updatedAt: "2023-12-05T14:30:00Z",
    author: {
      name: "Jane Smith",
      image: "/images/authors/jane-smith.jpg",
      bio: "TypeScript enthusiast and software architect",
    },
    coverImage: "/images/blog/typescript.jpg",
    tags: ["TypeScript", "JavaScript", "Programming"],
    readingTime: "8 min",
  },
]; 