import { formatMoney, type DemoLocale } from "@app/ui";
import type { Locale } from "../i18n/dictionary";

function toDemoLocale(locale: Locale): DemoLocale {
  return locale === "fr" ? "fr-CH" : "en-CH";
}

/** Formate un montant CHF affiché dans la maquette (`Intl`, jamais un calcul de prix — `@app/ui`). */
export function formatChf(amountCents: number, locale: Locale): string {
  return formatMoney(amountCents, "CHF", toDemoLocale(locale));
}
