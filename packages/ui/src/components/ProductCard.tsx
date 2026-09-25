import type { ReactElement, ReactNode } from "react";

export interface ProductCardProps {
  readonly name: string;
  readonly description?: string;
  /** Prix affiché, déjà formaté par l'appelant (`formatMoney`) — ce composant ne calcule aucun prix. */
  readonly formattedPrice: string;
  /** Libellés d'allergènes déjà traduits, affichés avant tout ajout au panier (AC-P01-06). */
  readonly allergens: readonly string[];
  readonly allergensLabel: string;
  readonly soldOut: boolean;
  readonly soldOutLabel: string;
  /** Contenu additionnel (groupes d'options, bouton d'ajout) — composé par l'app appelante. */
  readonly children?: ReactNode;
}

// Composant pur : aucune donnée fictive importée (AC-P01-11) — reçoit uniquement des primitives déjà
// résolues par l'app (nom, prix formaté, libellés traduits).
export function ProductCard({
  name,
  description,
  formattedPrice,
  allergens,
  allergensLabel,
  soldOut,
  soldOutLabel,
  children,
}: ProductCardProps): ReactElement {
  const classes = ["ui-card", "ui-product-card", soldOut ? "ui-product-card--sold-out" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes} aria-disabled={soldOut || undefined}>
      <div className="ui-product-card__photo" aria-hidden="true">
        {name
          .split(" ")
          .map((word) => word.charAt(0))
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
      <div className="ui-product-card__body">
        <div className="ui-product-card__header">
          <h3 className="ui-heading-lg">{name}</h3>
          <span className="ui-product-card__price">{formattedPrice}</span>
        </div>
        {description ? <p className="ui-text-muted">{description}</p> : null}
        {allergens.length > 0 ? (
          <div className="ui-product-card__allergens">
            <span className="ui-visually-hidden">{allergensLabel}</span>
            {allergens.map((allergen) => (
              <span key={allergen} className="ui-badge ui-badge--allergen">
                {allergen}
              </span>
            ))}
          </div>
        ) : null}
        {soldOut ? <span className="ui-badge">{soldOutLabel}</span> : children}
      </div>
    </article>
  );
}
