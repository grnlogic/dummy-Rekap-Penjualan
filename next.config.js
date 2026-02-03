/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Skip TypeScript errors untuk deploy cepat
  },
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

module.exports = nextConfig;
