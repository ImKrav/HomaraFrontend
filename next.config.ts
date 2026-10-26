import type { NextConfig } from "next";

// DEF-SEG-FE-01: sin X-Powered-By y sin poder embeber la app en un iframe (clickjacking).
// La CSP se limita a directivas que no rompen los scripts en línea que inyecta Next.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
