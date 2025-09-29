import { createHash } from "node:crypto";

export function generatePersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Bjorn Melin",
    url: "https://bjornmelin.com",
    jobTitle: "Senior Data Scientist & Cloud Solutions Architect",
    description:
      "Senior Data Scientist and Cloud Solutions Architect specializing in neuro-symbolic AI, deep learning, and MLOps. AWS Machine Learning Engineer and 6x AWS Certified professional with expertise in cloud architecture, AI engineering, and modern development practices.",
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

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Bjorn Melin - Portfolio",
    url: "https://bjornmelin.com",
    description:
      "Personal portfolio of Bjorn Melin, Senior Data Scientist and AWS Machine Learning Engineer specializing in neuro-symbolic AI, deep learning, and cloud architecture.",
    author: {
      "@type": "Person",
      name: "Bjorn Melin",
    },
  };
}

interface StructuredDataProps {
  type: "person" | "website" | "both";
}

const createSchemaKey = (schema: Record<string, unknown>): string => {
  const type = typeof schema["@type"] === "string" ? (schema["@type"] as string) : undefined;
  const name = typeof schema.name === "string" ? (schema.name as string) : undefined;
  const baseKey = [type, name].filter(Boolean).join("-");
  const serialized = JSON.stringify(schema);
  const digest = createHash("sha256").update(serialized).digest("hex").slice(0, 12);
  return baseKey ? `${baseKey}-${digest}` : digest;
};

export default function StructuredData({ type }: StructuredDataProps) {
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
          <script key={createSchemaKey(record)} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        );
      })}
    </>
  );
}
