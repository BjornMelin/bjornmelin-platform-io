import { nanoid } from "nanoid";
import { useMemo } from "react";

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

export default function StructuredData({ type }: StructuredDataProps) {
  // Generate stable, unique keys for each schema type
  const schemaWithKeys = useMemo(() => {
    const schemas = [];

    if (type === "person" || type === "both") {
      schemas.push({
        id: `person-schema-${nanoid()}`,
        data: generatePersonSchema(),
      });
    }

    if (type === "website" || type === "both") {
      schemas.push({
        id: `website-schema-${nanoid()}`,
        data: generateWebsiteSchema(),
      });
    }

    return schemas;
  }, [type]);

  return (
    <>
      {schemaWithKeys.map(({ id, data }) => {
        // Safely serialize JSON data to prevent XSS
        const safeJsonString = JSON.stringify(data)
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e")
          .replace(/&/g, "\\u0026")
          .replace(/'/g, "\\u0027")
          .replace(/"/g, "\\u0022");

        return (
          <script
            key={id}
            type="application/ld+json"
            // Using a safer approach than dangerouslySetInnerHTML
            suppressHydrationWarning
          >
            {safeJsonString}
          </script>
        );
      })}
    </>
  );
}
