import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Evita falha de deploy por warnings de lint (ex.: unused vars)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Em caso de erro de tipo residual, ainda gera o build (MVP)
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
