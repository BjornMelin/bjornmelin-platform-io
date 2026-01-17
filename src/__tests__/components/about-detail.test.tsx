import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock UI components
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock data dependencies
vi.mock("@/data/skills", () => ({
  skillCategories: [
    {
      name: "Cloud & DevOps",
      Icon: () => <span>CloudIcon</span>,
      color: "text-blue-500",
      skills: ["AWS", "Docker"],
    },
  ],
}));

vi.mock("@/data/certifications", () => ({
  certifications: [
    {
      name: "AWS Solutions Architect",
      issuedBy: "Amazon Web Services",
      issuedDate: "2024",
      image: "/cert.png",
      link: "https://aws.amazon.com",
    },
    {
      name: "AWS Machine Learning",
      issuedBy: "Amazon Web Services",
      issuedDate: "2023",
      image: "/cert-ml.png",
      link: "https://aws.amazon.com/ml",
      earlyAdopterBadge: {
        name: "Early Adopter",
        link: "https://aws.amazon.com/badges",
        image: "/badge.png",
      },
    },
  ],
}));

vi.mock("@/data/education", () => ({
  education: {
    degree: "B.S. in Computer Science",
    school: "Test University",
    startDate: "2016",
    endDate: "2020",
    gpa: "3.9",
    honors: [{ name: "Summa Cum Laude" }, { name: "Dean's List" }],
    activities: [{ name: "Computer Science Club" }],
  },
}));

vi.mock("@/data/experience", () => ({
  experiences: [
    {
      title: "Senior Data Scientist",
      company: "Test Corp",
      location: "Remote",
      isRemote: true,
      startDate: "2022",
      endDate: "Present",
      achievements: [{ text: "Led AI initiatives" }],
      skills: [{ name: "Python" }],
    },
    {
      title: "ML Engineer",
      company: "Example Corp",
      location: "Onsite",
      isRemote: false,
      startDate: "2020",
      endDate: "2022",
      achievements: [{ text: "Shipped models" }],
      skills: [],
    },
  ],
  previousExperiences: [
    {
      title: "Data Analyst",
      company: "Prev Corp",
      startDate: "2020",
      endDate: "2022",
    },
  ],
}));

vi.mock("@/data/hobbies", () => ({
  hobbies: [{ name: "Skiing", emoji: "⛷️", description: "Freestyle skiing" }],
}));

// Import after mocks
import { AboutDetail } from "@/components/sections/about-detail";

describe("AboutDetail", () => {
  it("renders profile section with name", () => {
    render(<AboutDetail />);

    expect(screen.getByRole("heading", { level: 1, name: /bjorn melin/i })).toBeInTheDocument();
  });

  it("renders professional title", () => {
    render(<AboutDetail />);

    // Text appears multiple times (header + experience section), use getAllByText
    const seniorDataScientistMatches = screen.getAllByText(/senior data scientist/i);
    expect(seniorDataScientistMatches.length).toBeGreaterThan(0);
    expect(screen.getByText(/cloud solutions architect/i)).toBeInTheDocument();
  });

  it("renders profile image", () => {
    render(<AboutDetail />);

    const image = screen.getByRole("img", { name: /bjorn melin/i });
    expect(image).toBeInTheDocument();
  });

  it("renders professional summary section", () => {
    render(<AboutDetail />);

    expect(screen.getByText("Professional Summary")).toBeInTheDocument();
  });

  it("renders skills section", () => {
    render(<AboutDetail />);

    expect(screen.getByText("Skills & Expertise")).toBeInTheDocument();
    expect(screen.getByText("Cloud & DevOps")).toBeInTheDocument();
  });

  it("renders work experience section", () => {
    render(<AboutDetail />);

    expect(screen.getByText("Work Experience")).toBeInTheDocument();
    expect(screen.getByText("Senior Data Scientist")).toBeInTheDocument();
    expect(screen.getByText("Test Corp")).toBeInTheDocument();
    expect(screen.getByText("ML Engineer")).toBeInTheDocument();
    expect(screen.getByText("Example Corp")).toBeInTheDocument();
  });

  it("renders achievements in experience", () => {
    render(<AboutDetail />);

    expect(screen.getByText("Led AI initiatives")).toBeInTheDocument();
    expect(screen.getByText("Shipped models")).toBeInTheDocument();
  });

  it("renders previous experience section", () => {
    render(<AboutDetail />);

    expect(screen.getByText("Previous Experience")).toBeInTheDocument();
    expect(screen.getByText("Data Analyst")).toBeInTheDocument();
  });

  it("renders certifications section", () => {
    render(<AboutDetail />);

    expect(screen.getByText("AWS Certifications")).toBeInTheDocument();
    expect(screen.getByText("AWS Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("AWS Machine Learning")).toBeInTheDocument();
    const machineLearningLink = screen.getByRole("link", { name: /aws machine learning/i });
    expect(machineLearningLink).toHaveAttribute("href", "https://aws.amazon.com/ml");
    expect(screen.getByRole("img", { name: "AWS Machine Learning" })).toHaveAttribute(
      "src",
      "/cert-ml.png",
    );
    const earlyAdopterLink = screen.getByRole("link", { name: /early adopter/i });
    expect(earlyAdopterLink).toHaveAttribute("href", "https://aws.amazon.com/badges");
    expect(screen.getByRole("img", { name: "Early Adopter" })).toHaveAttribute("src", "/badge.png");
  });

  it("renders education section", () => {
    render(<AboutDetail />);

    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("B.S. in Computer Science")).toBeInTheDocument();
    expect(screen.getByText("Test University")).toBeInTheDocument();
    expect(screen.getByText("Summa Cum Laude")).toBeInTheDocument();
    expect(screen.getByText("Dean's List")).toBeInTheDocument();
  });

  it("renders hobbies section", () => {
    render(<AboutDetail />);

    expect(screen.getByText("Hobbies & Interests")).toBeInTheDocument();
    // Skiing appears multiple times (hobby name + description), use getAllByText
    const skiingMatches = screen.getAllByText(/skiing/i);
    expect(skiingMatches.length).toBeGreaterThan(0);
  });
});
