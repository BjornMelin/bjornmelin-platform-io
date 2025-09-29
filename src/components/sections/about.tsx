"use client";

import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { skillCategories } from "@/data/skills";

export function About() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute left-0 bottom-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20 relative">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-3 h-3 mr-2 text-primary" />
            About Me
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Crafting AI Solutions & <span className="text-primary">Cloud Architecture</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Senior Data Scientist and AWS Solutions Architect specializing in AI/ML innovations and
            scalable cloud architecture
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-8 items-start mb-16">
          {/* Professional Summary */}
          <Card className="lg:col-span-2 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg bg-primary/10`}>
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Background</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              As a Senior Data Scientist and Cloud Solutions Architect with 6 AWS certifications, I
              specialize in developing cutting-edge AI/ML solutions and GenAI innovations. My
              expertise spans cloud architecture, machine learning, and building scalable AI
              solutions that drive business value.
            </p>
          </Card>

          {/* Skills Grid */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
            {skillCategories.map((category) => (
              <Card key={category.name} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <category.Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className={`${category.color} hover:scale-105 transition-transform`}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center relative z-10">
          <Link
            href="/about"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors group pointer-events-auto"
          >
            Learn More About Me
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
