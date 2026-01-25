import Brain from "lucide-react/dist/esm/icons/brain";
import Cloud from "lucide-react/dist/esm/icons/cloud";
import Code from "lucide-react/dist/esm/icons/code";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import type { ElementType } from "react";

export interface SkillCategory {
  name: string;
  Icon: ElementType;
  skills: string[];
  color: string;
}

export const skillCategories: SkillCategory[] = [
  {
    name: "AI & Machine Learning",
    Icon: Brain,
    color: "bg-purple-500/10 text-purple-500",
    skills: [
      "Neural Networks",
      "Reinforcement Learning",
      "Deep Learning",
      "Generative AI",
      "Neuro-symbolic AI",
      "Causal Inference",
      "LLM Fine-Tuning",
    ],
  },
  {
    name: "Cloud Architecture & MLOps",
    Icon: Cloud,
    color: "bg-blue-500/10 text-blue-500",
    skills: [
      "AWS SageMaker",
      "Docker/Kubernetes",
      "CloudFormation",
      "Vector DBs",
      "GPU Acceleration",
      "CI/CD",
      "Docker",
      "Git",
    ],
  },
  {
    name: "Programming",
    Icon: Code,
    color: "bg-green-500/10 text-green-500",
    skills: [
      "Python",
      "Java",
      "TypeScript",
      "TensorFlow",
      "PyTorch",
      "LangChain",
      "Hugging Face Transformers",
      "Scikit-Learn",
      "CUDA",
      "Pandas",
      "NumPy",
    ],
  },
  {
    name: "Data Science",
    Icon: Terminal,
    color: "bg-orange-500/10 text-orange-500",
    skills: [
      "Feature Engineering",
      "Dimensionality Reduction",
      "Clustering",
      "Statistical Modeling",
      "Databricks",
      "Plotly Dash",
    ],
  },
];
