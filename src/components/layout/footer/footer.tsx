"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import { BookText } from "lucide-react";
import { BookOpenCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand and Copyright */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Portfolio</h3>
            <p className="text-sm text-foreground/60">
              © {new Date().getFullYear()} Bjorn Melin. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/about"
                className="text-sm text-foreground/60 hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/projects"
                className="text-sm text-foreground/60 hover:text-foreground"
              >
                Projects
              </Link>
              <Link
                href="/blog"
                className="text-sm text-foreground/60 hover:text-foreground"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className="text-sm text-foreground/60 hover:text-foreground"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/bjornmelin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 hover:text-foreground"
                aria-label="GitHub"
              >
                <GitHubLogoIcon className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/in/bjorn-melin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 hover:text-foreground"
                aria-label="LinkedIn"
              >
                <LinkedInLogoIcon className="w-5 h-5" />
              </a>
              <a
                href="https://medium.com/@bjornmelin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 hover:text-foreground"
                aria-label="Medium"
              >
                <BookText size={20} />
              </a>
              <a
                href="https://orcid.org/0009-0004-1978-3356"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 hover:text-foreground"
                aria-label="ORCID"
              >
                <BookOpenCheck size={20} />
              </a>
              <a
                href="mailto:bjornmelin16@gmail.com"
                className="text-foreground/60 hover:text-foreground"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
