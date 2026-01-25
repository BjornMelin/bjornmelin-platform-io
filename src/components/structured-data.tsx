/** Structured data helpers and component for JSON-LD schemas. */
import { createHash } from "node:crypto";
import type React from "react";
import { PROFILE } from "@/lib/profile";

/**
 * Builds a JSON-LD Person schema for the portfolio owner.
 * @returns JSON-LD compliant schema object with basic person details.
 */
export function generatePersonSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PROFILE.name,
    url: "https://bjornmelin.com",
    jobTitle: PROFILE.shortTitle,
    description: PROFILE.summary,
    sameAs: [
      "https://github.com/bjornmelin",
      "https://linkedin.com/in/bjornmelin",
      "https://orcid.org/0000-0003-3891-5522",
      "https://www.coursera.org/learner/bjorn-melin",
    ],
    knowsAbout: [
      "Neuro-symbolic AI",
      "Deep Learning",
      "Reinforcement Learning",
      "Machine Learning Engineering",
      "AWS Cloud Architecture",
      "Serverless Computing",
      "MLOps",
      "Data Science",
      "Full Stack Development",
      "Python Development",
      "TensorFlow & PyTorch",
      "LangChain & Vector Databases",
      "CI/CD & Infrastructure as Code",
      "Kubernetes & Docker",
      "Next.js & React Development",
      "Node.js Development",
      "Statistical Modeling",
      "Clustering & Dimensionality Reduction",
      "Innovation & Cloud Computing",
    ],
  };
}

/**
 * Builds a JSON-LD WebSite schema for the portfolio.
 * @returns JSON-LD compliant WebSite schema object.
 */
export function generateWebsiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${PROFILE.name} - Portfolio`,
    url: "https://bjornmelin.com",
    description: PROFILE.websiteSummary,
    author: {
      "@type": "Person",
      name: PROFILE.name,
    },
  };
}

/** Props for the StructuredData component. */
interface StructuredDataProps {
  type: "person" | "website" | "both";
}

/**
 * Creates a stable React key for a JSON-LD schema.
 * @param schema - JSON-LD schema object.
 * @returns Stable key string safe for React keys.
 */
export const createSchemaKey = (schema: Record<string, unknown>): string => {
  const type = typeof schema["@type"] === "string" ? (schema["@type"] as string) : undefined;
  const name = typeof schema.name === "string" ? (schema.name as string) : undefined;
  const baseKey = [type, name].filter(Boolean).join("-");
  const serialized = JSON.stringify(schema);
  const digest = createHash("sha256").update(serialized).digest("hex").slice(0, 12);
  return baseKey ? `${baseKey}-${digest}` : digest;
};

/**
 * Renders JSON-LD schemas based on the requested type.
 * @param type - Controls which schemas are emitted.
 * @returns React fragment containing JSON-LD script elements.
 */
export default function StructuredData({ type }: StructuredDataProps): React.ReactElement {
  const schemas = [];

  if (type === "person" || type === "both") {
    schemas.push(generatePersonSchema());
  }

  if (type === "website" || type === "both") {
    schemas.push(generateWebsiteSchema());
  }

  return (
    <>
      {schemas.map((schema) => {
        const record = schema as Record<string, unknown>;
        return (
          <script
            key={createSchemaKey(record)}
            type="application/ld+json"
            suppressHydrationWarning
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is static and controlled.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        );
      })}
    </>
  );
}
