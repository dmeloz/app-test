import type { ButtonHTMLAttributes, ReactElement } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Étend le bouton sur toute la largeur disponible (ex. « Payer » du panier). */
  readonly block?: boolean;
}

// Cible tactile ≥ 44×44 px (`.claude/rules/frontend.md`), état focus visible (feuille de style du
// thème demo) — `type="button"` par défaut pour ne jamais soumettre un formulaire par accident.
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  type = "button",
  className,
  ...rest
}: ButtonProps): ReactElement {
  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    size === "sm" ? "ui-button--sm" : "",
    block ? "ui-button--block" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classes} {...rest} />;
}
