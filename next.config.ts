import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reverse proxy: any browser request to /api/* is forwarded by the
  // Next.js server to the backend. The browser never needs to know the
  // backend URL (network alias on the backend service via docker compose).
  async rewrites() {
    const backend = process.env.INTERNAL_API_URL ?? "http://homara-backend:5000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
