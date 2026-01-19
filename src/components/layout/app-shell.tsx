import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-60 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-xs"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="grow pt-16 pb-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
