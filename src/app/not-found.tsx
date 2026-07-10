import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

/**
 * Renders the 404 Not Found page with navigation options.
 * @returns The JSX element for the not found page.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-balance text-3xl font-semibold tracking-tight">Page Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link href="/" className={buttonVariants()}>
          Go home
        </Link>
        <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
          Contact
        </Link>
      </div>
    </div>
  );
}
