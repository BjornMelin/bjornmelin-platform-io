import type { Metadata } from "next";
import { AboutDetail } from "@/components/sections/about-detail";

export const metadata: Metadata = {
  title: "About - Bjorn Melin | Senior Data Scientist & Cloud Architect",
  description:
    "Learn more about Bjorn Melin, a Senior Data Scientist and Cloud Solutions Architect with 6 AWS certifications, specializing in AI/ML solutions and cloud architecture.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AboutDetail />
    </div>
  );
}
