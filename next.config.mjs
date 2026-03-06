import path from "node:path";
import { fileURLToPath } from "node:url";
import { deviceSizes, imageSizes } from "./src/lib/config/image-sizes.mjs";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1) In Next.js 14+, this tells Next.js to produce static files in "out/" during `next build`.
  output: "export",
  turbopack: {
    root: repoRoot,
  },

  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    deviceSizes,
    imageSizes,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bjornmelin.io",
      },
    ],
  },
  trailingSlash: true,
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
