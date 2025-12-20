import bundleAnalyzer from "@next/bundle-analyzer";
import withExportImages from "next-export-optimize-images";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1) In Next.js 14+, this tells Next.js to produce static files in "out/" during `next build`.
  output: "export",

  images: {
    // Note: unoptimized removed - next-export-optimize-images handles optimization
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bjornmelin.io",
      },
    ],
  },
  trailingSlash: true,
  reactStrictMode: true,

  // Optimize package imports for smaller bundles
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default withBundleAnalyzer(withExportImages(nextConfig));
