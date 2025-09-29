export interface Achievement {
  text: string;
}

export interface Skill {
  name: string;
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isRemote?: boolean;
  achievements: Achievement[];
  skills: Skill[];
}

export const experiences: Experience[] = [
  {
    title: "Senior Data Scientist",
    company: "3M",
    location: "Maplewood, Minnesota, United States",
    startDate: "May 2024",
    endDate: "Present",
    isRemote: true,
    achievements: [
      {
        text:
          "Led a high-profile neuro-symbolic AI project that reduced training data needs by 40% and " +
          "solved complex material science challenges. Delivered groundbreaking results in Atari benchmarks " +
          "and contributed to a Nature manuscript, earning recognition from senior executives, including the CTO.",
      },
      {
        text:
          "Migrated 3M's Corporate Research Analytical Lab's infrastructure to AWS, cutting cloud costs by " +
          "60% and establishing scalable frameworks for manufacturing and divisional teams.",
      },
      {
        text: "Developed a Random Forest machine learning model (>95% accuracy) that boosted property uniformity by 20%.",
      },
      {
        text:
          "Standardized IaC with reusable CloudFormation templates, reducing deployment times by 60%. " +
          "Transitioned CI/CD pipelines to GitHub Actions, increasing deployment reliability by 50% " +
          "with automated branching and testing strategies.",
      },
      {
        text:
          "Streamlined automation and deployment processes by transitioning CI/CD pipelines to GitHub Actions and " +
          "developing CloudFormation IaC, improving reliability and reducing deployment times by up to 60%. " +
          "Designed Python libraries and reusable Docker images, cutting dependency loads by 80% and ensuring " +
          "consistent, efficient workflows across projects.",
      },
    ],
    skills: [
      { name: "Neuro-symbolic AI" },
      { name: "Deep Learning" },
      { name: "FastAPI" },
      { name: "AWS" },
      { name: "Machine Learning" },
      { name: "Reinforcement Learning" },
      { name: "CloudFormation" },
      { name: "GitHub Actions" },
      { name: "Python" },
    ],
  },
  {
    title: "Advanced Data Scientist",
    company: "3M",
    location: "Maplewood, Minnesota, United States",
    startDate: "Dec 2022",
    endDate: "May 2024",
    isRemote: true,
    achievements: [
      {
        text:
          "Delivered a $750M revenue-saving solution, leading defect detection via PCA and clustering algorithms " +
          "to identify adhesive defects, ensuring FTIR-ATR measurement consistency in clients production environments.",
      },
      {
        text: "Created real-time analysis workflows, cutting data processing time by 80% and improving neural network accuracy by 20%.",
      },
      {
        text: "Built scalable libraries for regression, classification, and clustering used by global R&D teams",
      },
      {
        text: "Founded Python Plotly Dash Working Group; launched 12 data science apps in one year, impacting 100+ users across 6 divisions",
      },
    ],
    skills: [
      { name: "PCA" },
      { name: "Clustering" },
      { name: "Neural Networks" },
      { name: "Python" },
      { name: "Plotly Dash" },
      { name: "AWS" },
      { name: "Databricks" },
    ],
  },
  {
    title: "Advanced Software Engineer",
    company: "3M",
    location: "Salt Lake City, Utah, United States",
    startDate: "Mar 2022",
    endDate: "Dec 2022",
    achievements: [
      {
        text:
          "Migrated from Internet Explorer to Chromium Embedded Framework (C#/.NET), eliminating " +
          "vulnerabilities and boosting system performance by 25%.",
      },
      {
        text: "Automated medical coding/billing, improving coding accuracy by 20% and processing time by 30%.",
      },
      {
        text:
          "Reduced infrastructure costs by 35% through deploying Kubernetes-based microservices with " +
          "optimized container scaling and resource allocation.",
      },
      {
        text: "Implemented ClickOnce deployment, cutting deployment costs by 20%.",
      },
    ],
    skills: [
      { name: "C#" },
      { name: ".NET" },
      { name: "Kubernetes" },
      { name: "Microservices" },
      { name: "DevOps" },
      { name: "ClickOnce" },
      { name: "Java" },
    ],
  },
  {
    title: "Software Engineer",
    company: "3M",
    location: "Maplewood, Minnesota, United States",
    startDate: "Sep 2020",
    endDate: "Mar 2022",
    achievements: [
      {
        text:
          "Designed and deployed a cloud-based system for managing 3M's R&D research and reports using Angular, " +
          "Java, AWS, and Spring Framework. Migrated on-prem storage to AWS, achieving 40% scalability improvement and " +
          "$2M in cost savings by optimizing services like Jenkins, Lambda, ECS, and RDS.",
      },
      {
        text:
          "Led a team of software engineers to deliver a cloud-based project one month ahead of schedule and " +
          "10% under budget, saving $50K+ in overhead costs while exceeding client expectations.",
      },
      {
        text:
          "Achieved 3M's Circle of Technical Excellence & Innovation (CTE&I) Award, the company's highest R&D " +
          "honor for scientists and engineers, for developing 3M's most-used internal cloud platform.",
      },
      {
        text: "Shortened R&D IT software development lifecycles by 20% through managing Agile methodologies.",
      },
    ],
    skills: [
      { name: "Java" },
      { name: "AWS" },
      { name: "Spring Framework" },
      { name: "Angular" },
      { name: "Jenkins" },
      { name: "MySQL" },
      { name: "Agile" },
    ],
  },
  {
    title: "Software Development Engineer",
    company: "C-TEQ Data Consultants",
    location: "Minneapolis, Minnesota, United States",
    startDate: "Jan 2020",
    endDate: "Sep 2020",
    achievements: [
      {
        text: "Increased system performance by 90% via designing custom Java-based APIs",
      },
      {
        text:
          "Built a cross-platform desktop app with JavaFX and MySQL, allowing clients to " +
          "process and analyze large datasets efficiently.",
      },
    ],
    skills: [{ name: "Java" }, { name: "JavaFX" }, { name: "MySQL" }, { name: "APIs" }],
  },
];

export const previousExperiences: Experience[] = [
  {
    title: "Undergraduate IoT Researcher",
    company: "Augsburg University",
    location: "Minneapolis, Minnesota, United States",
    startDate: "Nov 2019",
    endDate: "May 2020",
    achievements: [],
    skills: [],
  },
  {
    title: "IT Data Analyst Intern",
    company: "3M",
    location: "Maplewood, Minnesota, United States",
    startDate: "May 2019",
    endDate: "Aug 2019",
    achievements: [],
    skills: [],
  },
  {
    title: "Undergraduate AI Researcher",
    company: "Augsburg University",
    location: "Minneapolis, Minnesota, United States",
    startDate: "Dec 2018",
    endDate: "Oct 2019",
    achievements: [],
    skills: [
      { name: "Python" },
      { name: "Neural Networks" },
      { name: "Machine Learning" },
      { name: "Game Learning" },
    ],
  },
];
