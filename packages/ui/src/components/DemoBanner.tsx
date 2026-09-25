import type { ReactElement } from "react";

// Bandeau permanent « Démonstration — aucune commande réelle » (spec P01 §2, AC-P01-07) : aucune
// prop de fermeture/masquage n'existe volontairement sur ce composant — un bandeau qu'on peut fermer
// ne serait plus « non masquable ». `role="note"` : contenu informatif persistant, pas une alerte
// ponctuelle (`role="alert"` interromprait les lecteurs d'écran à chaque changement de page).
export interface DemoBannerProps {
  readonly text: string;
}

export function DemoBanner({ text }: DemoBannerProps): ReactElement {
  return (
    <div className="ui-banner" role="note">
      {text}
    </div>
  );
}
