import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { skillCategories } from "@/data/skills";
import { PROFILE } from "@/lib/profile";

/** Renders the About component. */
export function About() {
  return (
    <section
      aria-labelledby="about-heading"
      className="py-24 relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background"
    >
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute left-0 bottom-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-20 relative">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-3 h-3 mr-2 text-primary" aria-hidden="true" />
            About Me
          </Badge>
          <h2 id="about-heading" className="text-4xl md:text-5xl font-bold mb-6">
            Crafting AI Solutions & <span className="text-primary">Cloud Architecture</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{PROFILE.aboutLead}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start mb-16">
          <Card className="lg:col-span-2 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg bg-primary/10`}>
                <GraduationCap className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold">Background</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{PROFILE.aboutBody}</p>
          </Card>

          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
            {skillCategories.map((category) => (
              <Card key={category.name} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <category.Icon className="w-6 h-6" aria-hidden="true" />
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

        <div className="text-center relative z-10">
          <Link
            href="/about"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors group pointer-events-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Learn More About Me
            <ArrowRight
              className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
