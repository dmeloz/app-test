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
 * = 2, JPY = 0 dans la plupart des cas...) ; diviser systématiquement par 100 était faux pour toute
 * devise différente de 2 décimales. `Intl.NumberFormat(...).resolvedOptions().maximumFractionDigits`
 * donne le nombre de décimales que l'**ICU embarqué** (CLDR) applique par défaut à cette devise pour
 * l'affichage — **pas nécessairement la norme ISO 4217, ni la convention du PSP** (N4, audit-2.md) :
 * CLDR arrondit certaines devises à 0 décimale visuelle (HUF, IDR, COP, IQD, ALL, LAK, MMK…) alors
 * qu'ISO 4217 leur donne 2 ou 3 décimales et que Stripe traite par exemple HUF à 2 décimales ; le
 * résultat dépend en outre de la version d'ICU du moteur JS exécutant ce code. Sans conséquence en
 * CHF/EUR (2 décimales dans les deux référentiels) ; à corriger au plus tard au lot L04 par une table
 * explicite des décimales alignée ISO 4217/PSP pour les devises réellement supportées (voir N4).
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
