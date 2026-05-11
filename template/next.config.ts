import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 blocks dev-resource requests from any host other than localhost.
  // The Supabase magic-link cookie is scoped to 127.0.0.1, so we test sign-in
  // from there — allow it (dev only; no effect on production builds).
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
