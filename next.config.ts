import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable HTTP compression (gzip/brotli) for all responses
  compress: true,

  images: {
    // Modern image formats — browser picks the best supported format automatically
    // AVIF: ~50% smaller than JPEG | WebP: ~30% smaller than JPEG
    formats: ["image/avif", "image/webp"],

    // Responsive breakpoints — Next.js generates optimized srcsets for these widths
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],

    // Thumbnail sizes for small images (product cards, thumbnails)
    imageSizes: [64, 128, 256, 384],

    // Allow images from any HTTPS/HTTP hostname (S3, CDN, etc.)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],

    // Allowed quality values the optimizer will accept (Next 15+). 95 = near-lossless HD.
    qualities: [60, 75, 85, 95],

    // Cache optimised images on the CDN — 7 days.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },

  // Strict mode helps catch bugs early in development
  reactStrictMode: true,
};

export default nextConfig;
