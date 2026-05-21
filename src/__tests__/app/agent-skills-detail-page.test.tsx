import { describe, expect, it } from "vitest";
import { generateMetadata, generateStaticParams } from "@/app/agent-skills/[slug]/page";

describe("AgentSkillDetailPage route helpers", () => {
  it("generates static params for catalogued skills", () => {
    const params = generateStaticParams();

    expect(params).toContainEqual({ slug: "deep-researcher" });
    expect(params.length).toBeGreaterThan(10);
  });

  it("generates metadata for a skill detail page", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "deep-researcher" }),
    });

    expect(metadata.title).toBe("deep-researcher - Agent Skills Lab");
    expect(metadata.description).toContain("research");
    expect(metadata.alternates?.canonical).toBe("/agent-skills/deep-researcher");
  });
});
