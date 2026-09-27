import type { ReactElement } from "react";

export interface CartBarProps {
  readonly itemCount: number;
  readonly formattedTotal: string;
  readonly label: string;
  readonly href: string;
  readonly regionLabel: string;
}

// Barre de panier fixe en bas d'écran (spec P01 §2, écran « Menu »). `<a>` simple (pas `next/link`,
// `packages/ui` reste indépendant du framework) : navigation complète, acceptable pour une maquette.
export function CartBar({
  itemCount,
  formattedTotal,
  label,
  href,
  regionLabel,
}: CartBarProps): ReactElement | null {
  if (itemCount <= 0) {
    return null;
  }
  return (
    <div className="ui-cart-bar" role="region" aria-label={regionLabel}>
      <span>
        {itemCount} · {formattedTotal}
      </span>
      <a className="ui-button ui-button--primary" href={href}>
        {label}
      </a>
    </div>
  );
}
