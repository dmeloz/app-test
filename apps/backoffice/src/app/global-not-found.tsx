import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";

// M1 (audit-2.md) : page 404 globale pour toute route qui ne correspond à aucun segment connu (ex.
// `/fr/inexistant`) — voir le commentaire de `next.config.ts` et `docs/architecture/rendering-and-csp.md`.
// Contrairement à `not-found.tsx`, ce fichier n'est pas nested dans `[locale]/layout.tsx` : il doit
// fournir son propre document `<html>`/`<body>` et ne connaît pas la locale demandée (route non
// résolue) — contenu bilingue FR/EN minimal, cohérent avec les pages `[locale]` (AC-L00-09).
export const metadata: Metadata = {
  title: "404 — Page introuvable / Page not found",
};

export default async function GlobalNotFound(): Promise<ReactNode> {
  // Rendu dynamique obligatoire : le nonce CSP (`src/proxy.ts`) est calculé par requête et doit
  // être injecté dans les scripts inline générés par Next lui-même. Sans ceci, cette page resterait
  // prégénérée au build sans nonce disponible (c'est précisément le constat M1 de l'audit 2).
  await connection();

  return (
    <html lang="fr">
      <body>
        <main>
          <p lang="fr">Page introuvable.</p>
          <p lang="en">Page not found.</p>
        </main>
      </body>
    </html>
  );
}
