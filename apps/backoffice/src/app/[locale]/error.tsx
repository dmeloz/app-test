"use client";

import type { ReactElement } from "react";
import { useServiceBoard } from "../../state/service-board-store";

interface LocaleErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

// M3 (audit-1.md) : limite de segment (`[locale]/error.tsx`), même raison que
// `apps/storefront/src/app/[locale]/error.tsx` — évite l'interface d'erreur par défaut de Next
// (`<style>` sans nonce CSP). Réinitialise aussi le tableau de service de démonstration.
export default function LocaleError({ reset }: LocaleErrorProps): ReactElement {
  const { resetDemo } = useServiceBoard();

  function handleReset(): void {
    resetDemo();
    reset();
  }

  return (
    <main className="ui-container">
      <div className="ui-stack">
        <h1 className="ui-heading-xl" lang="fr">
          Une erreur est survenue
        </h1>
        <p lang="fr">
          La démonstration a rencontré un problème inattendu. Réessayez, ou réinitialisez la
          démonstration.
        </p>
        <h1 className="ui-heading-xl" lang="en">
          Something went wrong
        </h1>
        <p lang="en">The demo ran into an unexpected problem. Try again, or reset the demo.</p>
        <button type="button" className="ui-button ui-button--primary" onClick={handleReset}>
          Réessayer / Try again
        </button>
      </div>
    </main>
  );
}
