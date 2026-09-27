"use client";

import type { ReactElement } from "react";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

// M3 (audit-1.md) : limite d'erreur racine — même raison que
// `apps/storefront/src/app/global-error.tsx` : Client Component obligatoire, sans accès au nonce
// CSP, volontairement dépourvu de tout style ou script en ligne (compatible par absence, pas par
// nonce).
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
