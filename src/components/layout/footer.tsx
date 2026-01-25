import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import BookOpenCheck from "lucide-react/dist/esm/icons/book-open-check";
import BookText from "lucide-react/dist/esm/icons/book-text";
import Mail from "lucide-react/dist/esm/icons/mail";
import Link from "next/link";

/**
 * Footer component.
 *
 * @returns Footer markup for the site.
 */
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand and Copyright */}
          <div className="flex flex-col gap-4">
            <h2 className="text-balance text-lg font-semibold">Portfolio</h2>
            <p className="text-sm text-foreground/60">
              © {new Date().getFullYear()} Bjorn Melin. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h2 className="text-balance text-lg font-semibold">Quick Links</h2>
            <nav aria-label="Footer" className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-foreground/60 hover:text-foreground">
                About
              </Link>
              <Link href="/projects" className="text-sm text-foreground/60 hover:text-foreground">
                Projects
              </Link>
              {/* <Link
                href="/blog"
                className="text-sm text-foreground/60 hover:text-foreground"
              >
                Blog
              </Link> */}
              <Link href="/contact" className="text-sm text-foreground/60 hover:text-foreground">
                Contact
              </Link>
            </nav>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <h2 className="text-balance text-lg font-semibold">Connect</h2>
            <div className="flex gap-4">
              <a
                href="https://github.com/bjornmelin"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xs text-foreground/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="GitHub"
              >
                <GitHubLogoIcon className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="https://linkedin.com/in/bjorn-melin"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xs text-foreground/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="LinkedIn"
              >
                <LinkedInLogoIcon className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="https://medium.com/@bjornmelin"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xs text-foreground/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Medium"
              >
                <BookText size={20} aria-hidden="true" />
              </a>
              <a
                href="https://orcid.org/0009-0004-1978-3356"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xs text-foreground/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="ORCID"
              >
                <BookOpenCheck size={20} aria-hidden="true" />
              </a>
              <Link
                href="/contact"
                className="rounded-xs text-foreground/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Contact form"
              >
                <Mail size={20} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
