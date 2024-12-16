"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Brain,
  Cloud,
  Code,
  Building2,
  GraduationCap,
  Award,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { certifications } from "@/data/certifications";
import { experiences, previousExperiences } from "@/data/experience";
import { education } from "@/data/education";
import { hobbies } from "@/data/hobbies";

export function AboutDetail() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-24">
        {/* Profile Section - First thing recruiters see */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary/10">
              <Image
                src="/headshot/headshot-2024.jpg"
                alt="Bjorn Melin"
                fill
                sizes="192px"
                priority
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Bjorn Melin</h1>
              <p className="text-xl text-muted-foreground mb-4">
                Senior Data Scientist & Cloud Solutions Architect
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/10">
                  <Cloud className="w-3 h-3 mr-2" /> AWS Certified
                </Badge>
                <Badge variant="outline" className="bg-primary/10">
                  <Brain className="w-3 h-3 mr-2" /> AI/ML Expert
                </Badge>
                <Badge variant="outline" className="bg-primary/10">
                  <Building2 className="w-3 h-3 mr-2" /> Cloud Architect
                </Badge>
                <Badge variant="outline" className="bg-primary/10">
                  <Code className="w-3 h-3 mr-2" /> Full-Stack Developer
                </Badge>
                <Badge variant="outline" className="bg-primary/10">
                  <Sparkles className="w-3 h-3 mr-2" /> Generative AI Evangelist
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Professional Summary - Quick overview of value proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-20"
        >
          <Card className="p-8 backdrop-blur-xl bg-card/50 border-primary/10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Professional Summary
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                As a Senior Data Scientist at 3M Corporate Research Analytical Laboratory, I specialize in cloud solutions architecture, 
                developing scalable, cost-effective AWS infrastructures to solve complex analytical challenges. Based in Salt Lake City, 
                I bring expertise in AI/ML, generative AI, and data-driven cloud environments, with a track record of transforming 
                operations through efficient, reliable, and strategically designed solutions.
              </p>
              <p>
                My recent achievements include leading CRAL&apos;s infrastructure migration to AWS, resulting in 60% cost reduction, 
                and establishing scalable frameworks supporting diverse teams across 3M. I&apos;ve developed custom Python packages, 
                reusable IaC libraries, and modernized CI/CD pipelines, consistently delivering 50%+ improvements in performance 
                and deployment efficiency.
              </p>
              <p>
                With a strong foundation in Computer Science and Mathematics from Augsburg University and six AWS certifications, 
                I&apos;ve evolved from software engineering to become a leader in cloud architecture and data science. I&apos;m passionate 
                about advancing cloud-based technologies and architecting solutions that enable operational agility and innovation. 
                Outside of tech, I&apos;m an avid freestyle skier and outdoor enthusiast, bringing the same dedication to precision 
                and continuous improvement from the slopes to my professional work.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Work Experience - Most important for recruiters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Work Experience
          </h2>
          <div className="space-y-6">
            {experiences.map((exp) => (
              <Card key={`${exp.title}-${exp.startDate}`} className="p-6 backdrop-blur-xl bg-card/50 border-primary/10">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{exp.title}</h3>
                    <p className="text-primary">{exp.company}</p>
                    <p className="text-sm text-muted-foreground">
                      {exp.location}{exp.isRemote ? " (Remote)" : ""}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{exp.startDate} - {exp.endDate}</p>
                </div>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {exp.achievements.map((achievement, index) => (
                    <li key={index}>{achievement.text}</li>
                  ))}
                </ul>
                {exp.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {exp.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-primary/5">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}

            <Card className="p-6 backdrop-blur-xl bg-card/50 border-primary/10">
              <h3 className="text-xl font-semibold mb-4">Previous Experience</h3>
              <div className="space-y-4">
                {previousExperiences.map((exp) => (
                  <div key={`${exp.title}-${exp.startDate}`}>
                    <div className="flex justify-between mb-2">
                      <p className="font-medium">{exp.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {exp.startDate} - {exp.endDate}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Certifications - Shows current skills and continuous learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <Award className="w-8 h-8 text-primary" />
            AWS Certifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert) => (
              <motion.div
                key={cert.name}
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <Card className="p-6 backdrop-blur-xl bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                  <div className="flex flex-col gap-4">
                    <a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4"
                    >
                      <Image
                        src={cert.image}
                        alt={cert.name}
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                      <div>
                        <h3 className="font-semibold mb-1">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuedBy}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Issued: {cert.issuedDate}
                        </p>
                      </div>
                    </a>

                    {cert.earlyAdopterBadge && (
                      <>
                        <div className="border-t border-primary/10 my-2" />
                        <a
                          href={cert.earlyAdopterBadge.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3"
                        >
                          <Image
                            src={cert.earlyAdopterBadge.image}
                            alt={cert.earlyAdopterBadge.name}
                            width={40}
                            height={40}
                            className="rounded-lg"
                          />
                          <div>
                            <Badge variant="outline" className="bg-primary/5 mb-1">
                              Early Adopter
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {cert.earlyAdopterBadge.name}
                            </p>
                          </div>
                        </a>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Education - Supporting qualifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-20"
        >
          <Card className="p-8 backdrop-blur-xl bg-card/50 border-primary/10">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              Education
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{education.degree}</h3>
                    <p className="text-muted-foreground">{education.school}</p>
                  </div>
                  <div className="text-right mt-1 md:mt-0">
                    <p className="text-sm text-muted-foreground">
                      {education.startDate} - {education.endDate}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      GPA: {education.gpa}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {education.honors.map((honor, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`bg-primary/5 mb-2 ${index > 0 ? "ml-2" : ""}`}
                    >
                      {honor.name}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Activities and Societies:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                    {education.activities.map((activity, index) => (
                      <li key={index}>{activity.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Hobbies & Interests - Personal side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-8 backdrop-blur-xl bg-card/50 border-primary/10">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-primary"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Hobbies & Interests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hobbies.map((hobby, index) => (
                <div key={index} className="space-y-2">
                  <Badge variant="outline" className="bg-primary/5 text-base py-2 px-3">
                    {hobby.emoji} {hobby.name}
                  </Badge>
                  <p className="text-sm text-muted-foreground pl-2">
                    {hobby.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
