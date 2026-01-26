import { deviceSizes, imageSizes } from "./src/lib/config/image-sizes.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1) In Next.js 14+, this tells Next.js to produce static files in "out/" during `next build`.
  output: "export",

  // Allow Playwright (and other local tools) to request dev assets from 127.0.0.1
  // even when the dev server is started on "localhost".
  allowedDevOrigins: ["127.0.0.1"],

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
