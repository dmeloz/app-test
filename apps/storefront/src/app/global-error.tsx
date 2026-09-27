"use client";

import type { ReactElement } from "react";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

// M3 (audit-1.md) : limite d'erreur racine — capte une erreur survenant au-dessus même de
// `[locale]/layout.tsx` (ex. dans le layout racine lui-même). Contrairement à `[locale]/error.tsx`,
// ce composant doit fournir son propre document `<html>`/`<body>` (comme `app/global-not-found.tsx`)
// et est un Client Component obligatoire (contrainte Next) : il ne peut donc pas lire le nonce CSP
// via `headers()`. Volontairement dépourvu de tout `<style>`/attribut `style=""` et de tout script
// autre que celui, déjà autorisé par la CSP, que Next injecte lui-même pour hydrater cette page —
// c'est cette absence de style en ligne non couvert par un nonce qui rend ce composant compatible
// avec la CSP à nonce, pas un nonce qu'il ne peut pas obtenir.
export default function GlobalError({ reset }: GlobalErrorProps): ReactElement {
  return (
    <html lang="fr">
      <body>
        <main>
          <h1 lang="fr">Une erreur est survenue</h1>
          <p lang="fr">La démonstration a rencontré un problème inattendu.</p>
          <h1 lang="en">Something went wrong</h1>
          <p lang="en">The demo ran into an unexpected problem.</p>
          <button type="button" onClick={() => reset()}>
            Réessayer / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
