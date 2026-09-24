import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CSP à nonce (M1, audit-1.md) : modèle officiel de la documentation Next.js embarquée dans la
 * version installée (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`,
 * Next 16.3.6) — le fichier `middleware.ts` est déprécié depuis Next 16 au profit de `proxy.ts`
 * (fonction exportée `proxy`, plus `middleware`) : `apps/backoffice/src/middleware.ts` provoquait
 * l'avertissement de build « The "middleware" file convention is deprecated. Please use "proxy"
 * instead. », corrigé en renommant fichier et fonction.
 *
 * `parseRequestHeaders` (`next/dist/server/app-render/app-render.js`) extrait le nonce depuis
 * l'en-tête `content-security-policy` de la **requête** (posé ci-dessous via
 * `NextResponse.next({ request: { headers } })`), via `getScriptNonceFromHeader`, et l'applique
 * automatiquement aux scripts inline que Next génère lui-même (bootstrap, données RSC/hydratation)
 * — ce sont ces scripts que l'ancienne CSP statique (`default-src 'self'` sans nonce) bloquait
 * (constat M1 : erreurs console « Refused to execute inline script »).
 *
 * Les nonces exigent un rendu dynamique par requête (voir la doc citée ci-dessus, section « Static
 * vs Dynamic Rendering with CSP ») : `await connection()` dans le layout racine
 * (`src/app/[locale]/layout.tsx`) force ce rendu dynamique pour que le nonce soit effectivement
 * injecté (sans lui, les pages restent prégénérées au build, sans requête ni nonce disponibles).
 *
 * `strict-dynamic` : les scripts chargés par un script déjà autorisé (par nonce) héritent de la
 * confiance ; les navigateurs qui le comprennent ignorent alors les listes d'hôtes/`unsafe-inline`.
 * `'unsafe-eval'` en développement uniquement (recommandation officielle : React s'appuie sur `eval`
 * pour reconstruire les piles d'erreurs serveur en développement, jamais en production).
 *
 * `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` : conservés (M1, correctif exigé)
 * — critique pour le back-office (ADR 0010 : jamais servi sur un domaine client).
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `;
  const contentSecurityPolicy = cspHeader.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
