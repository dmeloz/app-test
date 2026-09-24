import type { NextConfig } from "next";

// En-têtes de sécurité de base (`.claude/rules/security.md`) : CSP restrictive, pas de script tiers
// au lot L00 (page statique). Sera affiné avec Stripe (paiement) et le thème dynamique en L05+.
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
  // `/` redirige vers `/fr` (défaut FR — la négociation Accept-Language complète est prévue au L05).
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
};

export default nextConfig;
