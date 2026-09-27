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
 * Formate un montant entier exprimé dans la plus petite unité de la devise (ex. centimes pour CHF,
 * fils pour BHD, l'unité elle-même pour JPY qui n'a pas de subdivision) en texte localisé
 * (`Intl.NumberFormat`), ex. `formatMoney(1250, "CHF", "fr-CH")` → "12.50 CHF".
 *
 * M4 (audit-1.md) : le nombre de décimales de la plus petite unité **dépend de la devise** (CHF/EUR
 * = 2, JPY = 0, BHD = 3 — norme ISO 4217) ; diviser systématiquement par 100 était faux pour toute
 * devise différente de 2 décimales. `Intl.NumberFormat(...).resolvedOptions().maximumFractionDigits`
 * donne le nombre de décimales réel que l'ICU embarqué applique à cette devise — jamais une valeur
 * codée en dur ni une liste de devises à maintenir à la main.
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
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const divisor = 10 ** fractionDigits;
  return formatter.format(amountCents / divisor);
}
