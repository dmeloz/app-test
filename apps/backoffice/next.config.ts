import type { NextConfig } from "next";

// En-têtes de sécurité de base (`.claude/rules/security.md`), hors CSP. Le back-office est un
// domaine séparé (ADR 0010) : jamais servi sur un domaine client.
//
// M1 (audit-1.md) : la CSP n'est plus posée ici de façon statique — `default-src 'self'` bloquait
// les scripts inline que Next.js génère lui-même (bootstrap, hydratation), sans confiance possible
// sans nonce. Elle est désormais calculée par requête dans `src/proxy.ts` (modèle officiel Next 16,
// nonce + `strict-dynamic`), qui pose l'en-tête `Content-Security-Policy` complet (incluant
// `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`).
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // L4 (audit-1.md) : ne pas annoncer le framework au client (`X-Powered-By: Next.js`).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // `/` redirige vers `/fr` (défaut FR — la négociation Accept-Language complète est prévue au L05).
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
};

export default nextConfig;
