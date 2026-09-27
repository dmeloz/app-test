"use client";

import type { ReactElement } from "react";
import { useCartStore } from "../../state/cart-store";

interface LocaleErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

// M3 (audit-1.md) : limite de segment (`[locale]/error.tsx`) — si le rendu d'une page lève une
// erreur, Next affiche par défaut son interface d'erreur intégrée, qui pose un `<style>` sans notre
// nonce CSP (« Refused to apply inline style », déjà constaté pour la 404 par défaut — voir
// `app/not-found.tsx`/`app/global-not-found.tsx`, même cause). Fournir cette limite propre l'évite :
// aucun style ni script en ligne n'est ajouté ici (classes `ui-*`, déjà stylées par la feuille de
// style unique injectée par `ThemeStyle` dans le layout parent — jamais un attribut `style=""`).
// Réinitialise aussi l'état de démonstration : la cause la plus probable d'une erreur de rendu ici
// est un état incohérent qui aurait échappé à la validation de `cart-store.tsx` (M3).
export default function LocaleError({ reset }: LocaleErrorProps): ReactElement {
  const { resetDemo } = useCartStore();

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
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- limite de segment
            générique (pas de `locale` fiable disponible ici) ; rechargement complet acceptable
            pour une page d'erreur de dernier recours. */}
        <a className="ui-button ui-button--secondary" href="/fr">
          Retour à l&apos;accueil / Back to home
        </a>
      </div>
    </main>
  );
}
