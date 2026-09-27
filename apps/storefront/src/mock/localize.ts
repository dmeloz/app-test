// provisoire — remplacé par packages/contracts au L04 (mécanisme i18n complet : `packages/i18n`, L05)
import type { Locale } from "../i18n/dictionary";
import type { LocalizedText } from "./types";

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
