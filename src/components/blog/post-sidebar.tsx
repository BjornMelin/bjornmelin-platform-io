import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface PostSidebarProps {
  content: string;
}

function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const id = text.toLowerCase().replace(/[^\w]+/g, '-');
    
    headings.push({
      id,
      text,
      level,
    });
  }

  return headings;
}

export function PostSidebar({ content }: PostSidebarProps) {
  const headings = extractHeadings(content);
  
  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-2 py-4">
        <h3 className="font-semibold">Table of Contents</h3>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                "block text-sm text-muted-foreground hover:text-foreground transition-colors",
                heading.level === 2 ? "pl-0" : "pl-4"
              )}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </ScrollArea>
  );
} 