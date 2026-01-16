/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1) In Next.js 14+, this tells Next.js to produce static files in "out/" during `next build`.
  output: "export",

  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    // Keep these in sync with scripts/generate-static-image-variants.mjs
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
