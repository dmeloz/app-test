// Formatage monétaire d'affichage uniquement (règle non négociable n°2 du CLAUDE.md : montants en
// entiers + devise ISO). `packages/ui` ne calcule jamais un montant : `formatMoney` prend un entier
// déjà calculé (centimes, ou plus petite unité de la devise) et le formate pour l'affichage via
// `Intl.NumberFormat`, jamais l'inverse.
export type DemoLocale = "fr-CH" | "en-CH";

export class MoneyFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyFormatError";
  }
}

const ISO_4217_PATTERN = /^[A-Z]{3}$/;

/**
 * Formate un montant entier exprimé dans la plus petite unité de la devise (ex. centimes) en texte
 * localisé (`Intl.NumberFormat`), ex. `formatMoney(1250, "CHF", "fr-CH")` → "CHF 12.50".
 */
export function formatMoney(amountCents: number, currency: string, locale: DemoLocale): string {
  if (!Number.isSafeInteger(amountCents)) {
    throw new MoneyFormatError(
      "Le montant doit être un entier sûr exprimé dans la plus petite unité de la devise (aucune fraction de centime).",
    );
  }
  if (!ISO_4217_PATTERN.test(currency)) {
    throw new MoneyFormatError(
      `Code de devise ISO 4217 invalide : attendu 3 lettres majuscules (reçu "${currency}").`,
    );
  }
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
  });
  return formatter.format(amountCents / 100);
}
