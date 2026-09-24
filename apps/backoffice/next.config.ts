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
  // M1 (audit-2.md) : `app/[locale]` sert de layout racine (modèle i18n officiel Next 16, aucun
  // `app/layout.tsx` séparé), mais aucune route n'existe pour un segment complètement inconnu
  // (ex. `/fr/inexistant`) : Next route alors vers une page « /_not-found » synthétique, rendue par
  // un layout racine minimal par défaut — jamais notre `[locale]/layout.tsx`, donc jamais le nonce
  // CSP posé par `src/proxy.ts`. C'est exactement le cas documenté par Next 16 pour justifier
  // `global-not-found` (« Your root layout is defined using top-level dynamic segments... »,
  // doc Next 16 embarquée : `node_modules/next/dist/docs/.../not-found.md`). `app/global-not-found.tsx`
  // reprend le nonce comme les autres pages. Voir `docs/architecture/rendering-and-csp.md`.
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // `/` redirige vers `/fr` (défaut FR — la négociation Accept-Language complète est prévue au L05).
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
};

export default nextConfig;
