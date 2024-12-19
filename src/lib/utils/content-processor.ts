import { marked, Renderer } from "marked";
import DOMPurify from "isomorphic-dompurify";
import Prism from "prismjs";

// Import required Prism components
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface ProcessedContent {
  html: string;
  headings: Heading[];
}

// Helper function to create safe IDs for headings
function createSafeId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Helper function to safely highlight code
function highlightCode(code: string, language: string | undefined): string {
  if (!language || !Prism.languages[language]) {
    return code;
  }

  try {
    return Prism.highlight(code, Prism.languages[language], language);
  } catch (error) {
    console.warn(
      `Failed to highlight code block (language: ${language}): ${error}`
    );
    return code;
  }
}

export async function processContent(
  content: string,
  copyToClipboard: (text: string) => void
): Promise<ProcessedContent> {
  const headings: Heading[] = [];

  // Configure marked with custom renderer
  const renderer = new Renderer();

  // Custom heading renderer
  renderer.heading = (text: string, level: number, raw: string) => {
    const id = createSafeId(raw);
    headings.push({ id, text, level });
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  // Custom code block renderer
  renderer.code = (code: string, language?: string) => {
    const highlightedCode = highlightCode(code, language);
    const languageClass = language ? ` language-${language}` : "";

    // Using a data attribute for copy functionality
    return `
      <div class="relative group">
        <pre class="overflow-x-auto${languageClass}"><code>${highlightedCode}</code></pre>
        <button
          class="copy-button absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-muted/80 px-2 py-1 rounded text-sm"
          aria-label="Copy code"
          type="button"
          data-code="${encodeURIComponent(code)}"
        >
          Copy
        </button>
      </div>
    `;
  };

  // Set the renderer in marked
  marked.use({ renderer });

  // Process markdown with custom renderer
  const rawHtml = await marked(content, {
    gfm: true,
    breaks: true,
    async: true,
  });

  // Sanitize the output HTML
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allowfullscreen",
      "frameborder",
      "target",
      "class",
      "id",
      "type",
    ],
  });

  return {
    html: sanitizedHtml,
    headings,
  };
}
