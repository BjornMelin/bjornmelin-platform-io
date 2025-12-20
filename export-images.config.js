/**
 * Configuration for next-export-optimize-images
 * @see https://next-export-optimize-images.vercel.app/docs/configuration
 * @type {import('next-export-optimize-images').Config}
 */
const config = {
  // Convert images to modern WebP format for smaller file sizes
  convertFormat: [
    ["png", "webp"],
    ["jpg", "webp"],
    ["jpeg", "webp"],
  ],

  // Image quality (75 is a good balance between quality and file size)
  quality: 75,

  // Device sizes for responsive images (matches Next.js defaults)
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],

  // Image sizes for smaller images like avatars and icons
  imageSizes: [16, 32, 48, 64, 96, 128, 256],

  // Generate optimized images during build
  generateFormats: ["webp"],
};

module.exports = config;
