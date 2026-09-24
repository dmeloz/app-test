import type { NextConfig } from "next";

// En-têtes de sécurité de base (`.claude/rules/security.md`), hors CSP : pas de script tiers au
// lot L00 (page statique). Sera affiné avec Stripe (paiement) et le thème dynamique en L05+.
//
// M1 (audit-1.md) : la CSP n'est plus posée ici de façon statique — `default-src 'self'` bloquait
// les scripts inline que Next.js génère lui-même (bootstrap, hydratation), sans confiance possible
// sans nonce. Elle est désormais calculée par requête dans `src/middleware.ts` (modèle officiel
// Next 16, nonce + `strict-dynamic`), qui pose l'en-tête `Content-Security-Policy` complet
// (incluant `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`).
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
