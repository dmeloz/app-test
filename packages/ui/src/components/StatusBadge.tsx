import type { ReactElement } from "react";

export type OrderStatus = "new" | "preparing" | "ready" | "paused" | "refused";

export interface StatusBadgeProps {
  readonly status: OrderStatus;
  /** Libellé déjà traduit (FR/EN) — ce composant ne choisit jamais le texte lui-même. */
  readonly label: string;
}

// Inspiration R1 (`docs/design/inspirations.md`) : statut = couleur **et** texte (jamais la couleur
// seule, daltonisme) ; le texte porte toujours l'information, la couleur ne fait que la renforcer.
export function StatusBadge({ status, label }: StatusBadgeProps): ReactElement {
  return <span className={`ui-status ui-status--${status}`}>{label}</span>;
}
