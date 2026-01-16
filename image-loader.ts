type ImageLoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

const isRemoteUrl = (src: string) => src.startsWith("https://") || src.startsWith("http://");

const stripQuery = (src: string) => {
  const index = src.indexOf("?");
  return index === -1 ? src : src.slice(0, index);
};

const getExtension = (src: string) => {
  const dotIndex = src.lastIndexOf(".");
  return dotIndex === -1 ? "" : src.slice(dotIndex + 1).toLowerCase();
};

const stripLeadingSlash = (src: string) => (src.startsWith("/") ? src.slice(1) : src);

export default function staticExportImageLoader({ src, width }: ImageLoaderParams): string {
  if (isRemoteUrl(src)) {
    return src;
  }

  const cleanSrc = stripQuery(stripLeadingSlash(src));
  const extension = getExtension(cleanSrc);

  // Keep SVG/GIF as-is (no variants generated)
  if (extension === "svg" || extension === "gif") {
    return src;
  }

  const base = cleanSrc.slice(
    0,
    Math.max(0, cleanSrc.length - (extension ? extension.length + 1 : 0)),
  );
  return `/_images/${base}_${width}.webp`;
}
