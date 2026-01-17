type ImageLoaderParams = {
  src: string;
  width: number;
  // quality is intentionally ignored: WebP quality is set at build time; keep for Next.js ImageLoader compatibility.
  quality?: number;
};

const isRemoteUrl = (src: string) =>
  src.startsWith("https://") ||
  src.startsWith("http://") ||
  src.startsWith("//") ||
  src.startsWith("data:") ||
  src.startsWith("blob:");

const stripQuery = (src: string) => {
  const index = src.indexOf("?");
  return index === -1 ? src : src.slice(0, index);
};

const getExtension = (src: string) => {
  const dotIndex = src.lastIndexOf(".");
  return dotIndex === -1 ? "" : src.slice(dotIndex + 1).toLowerCase();
};

const stripLeadingSlash = (src: string) => (src.startsWith("/") ? src.slice(1) : src);

const removeExtension = (src: string, extension: string) =>
  extension ? src.slice(0, Math.max(0, src.length - (extension.length + 1))) : src;

export default function staticExportImageLoader({ src, width }: ImageLoaderParams): string {
  if (isRemoteUrl(src)) {
    return src;
  }

  const cleanSrc = stripQuery(stripLeadingSlash(src));
  if (cleanSrc.startsWith("_images/")) {
    return src;
  }
  const extension = getExtension(cleanSrc);

  // Keep SVG/GIF as-is (no variants generated)
  if (extension === "svg" || extension === "gif") {
    return src;
  }

  const base = removeExtension(cleanSrc, extension);
  return `/_images/${base}_${width}.webp`;
}
