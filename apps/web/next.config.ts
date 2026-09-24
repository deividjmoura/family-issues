import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir o dev server por hosts de preview (ex.: sandboxes *.e2b.app).
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
