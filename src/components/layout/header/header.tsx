"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NavSeparator = () => (
  <span className="text-muted-foreground/30">|</span>
);

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Bjorn Melin | Portfolio
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/"
              className="text-foreground/60 hover:text-foreground"
            >
              Home
            </Link>
            <NavSeparator />
            <Link
              href="/about"
              className="text-foreground/60 hover:text-foreground"
            >
              About
            </Link>
            <NavSeparator />
            <Link
              href="/projects"
              className="text-foreground/60 hover:text-foreground"
            >
              Projects
            </Link>
            <NavSeparator />
            <Link
              href="/blog"
              className="text-foreground/60 hover:text-foreground"
            >
              Blog
            </Link>
            <NavSeparator />
            <Link
              href="/contact"
              className="text-foreground/60 hover:text-foreground"
            >
              Contact
            </Link>
            <NavSeparator />
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-foreground/60 hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-foreground/60 hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/projects"
                className="text-foreground/60 hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>
              <Link
                href="/blog"
                className="text-foreground/60 hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className="text-foreground/60 hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="flex items-center">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
