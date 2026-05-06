import type { NextConfig } from "next";

const awsRegion = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "ap-south-1";
const awsBucket =
  process.env.NEXT_PUBLIC_S3_BUCKET_NAME ||
  process.env.AWS_S3_BUCKET_NAME ||
  "";

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

    // SECURITY: restrict Next Image optimizer to trusted hosts only.
    // Previously this used `hostname: "**"`, which increases SSRF surface area.
    remotePatterns: [
      ...(process.env.NEXT_PUBLIC_CDN_HOST
        ? [{ protocol: "https" as const, hostname: process.env.NEXT_PUBLIC_CDN_HOST }]
        : []),
      {
        protocol: "https",
        hostname: awsBucket
          ? `${awsBucket}.s3.${awsRegion}.amazonaws.com`
          : `**.s3.${awsRegion}.amazonaws.com`,
      },
    ],

    // Allowed quality values the optimizer will accept (Next 15+). 95 = near-lossless HD.
    qualities: [60, 75, 85, 95],

    // Cache optimised images on the CDN — 7 days.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },

  // Strict mode helps catch bugs early in development
  reactStrictMode: true,

  // Disable CDN caching on admin routes so middleware always runs.
  // Without this, Amplify's CloudFront serves /admin/login from cache and
  // bypasses our admin gate middleware entirely.
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
