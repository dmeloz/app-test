import type { NextConfig } from "next";

// En-têtes de sécurité de base (`.claude/rules/security.md`). Le back-office est un domaine séparé
// (ADR 0010) : jamais servi sur un domaine client, CSP restrictive dès ce socle.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; base-uri 'self'; frame-ancestors 'none'",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
