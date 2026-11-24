import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server accept requests from 127.0.0.1 (used by the end-to-end checks).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
