import { describe, expect, it } from "vitest";
import { formatMoney, MoneyFormatError } from "./money.js";

// Valeurs attendues vérifiées contre la sortie réelle de `Intl.NumberFormat` (ICU embarqué dans
// Node) — jamais devinées (règle n°13 du CLAUDE.md). Les chaînes attendues contiennent de vraies
// espaces insécables (U+00A0, U+202F, séparateurs ICU) ; `no-irregular-whitespace` ignore par défaut
// les littéraux de chaîne (`skipStrings`), donc aucune dérogation n'est nécessaire ici.
describe("formatMoney", () => {
  it("formate un montant CHF en fr-CH (montant puis code devise)", () => {
    expect(formatMoney(1250, "CHF", "fr-CH")).toBe("12.50 CHF");
  });

  it("formate un montant CHF en en-CH (code devise puis montant)", () => {
    expect(formatMoney(1250, "CHF", "en-CH")).toBe("CHF 12.50");
  });

  it("gère le cas limite zéro", () => {
    expect(formatMoney(0, "CHF", "fr-CH")).toBe("0.00 CHF");
  });

  // Le séparateur de milliers dépend de la version d'ICU (Node 22 : U+202F en fr-CH ; Node 24 : « ' »).
  // On compare donc au séparateur de groupe que fournit l'ICU courant, pas à un littéral figé.
  it("gère un grand montant avec le séparateur de milliers de la locale (ICU courant)", () => {
    const cases = [
      ["fr-CH", "1234567.89 CHF"],
      ["en-CH", "CHF 1234567.89"],
    ] as const;
    for (const [locale, expectedWithoutGroups] of cases) {
      const group = new Intl.NumberFormat(locale)
        .formatToParts(1234567)
        .find((part) => part.type === "group")?.value;
      expect(group).toBeDefined();
      const formatted = formatMoney(123456789, "CHF", locale);
      expect(formatted.split(group ?? "").length - 1).toBe(2);
      const normalized = formatted
        .split(group ?? "")
        .join("")
        .replace(/[\s\u00a0\u202f]/gu, " ");
      expect(normalized).toBe(expectedWithoutGroups);
    }
  });

  it("refuse un montant non entier (fraction de centime)", () => {
    expect(() => formatMoney(10.5, "CHF", "fr-CH")).toThrow(MoneyFormatError);
  });

  it("refuse un entier non sûr", () => {
    expect(() => formatMoney(Number.MAX_SAFE_INTEGER + 2, "CHF", "fr-CH")).toThrow(
      MoneyFormatError,
    );
  });

  // M4 (audit-1.md) : le nombre de décimales de la plus petite unité dépend de la devise (norme ISO
  // 4217), pas toujours 2 — JPY n'a aucune subdivision (0 décimale), BHD en a 3 (le fils). Valeurs
  // choisies sous 1000 (unité entière) pour ne dépendre d'aucun séparateur de milliers (déjà instable
  // entre versions d'ICU, voir le test précédent) — seul le nombre de décimales est vérifié ici.
  // Le caractère d'espacement entre le montant et le code devise dépend lui aussi de l'ICU
  // (espace normale ou insécable U+00A0/U+202F selon la version) : normalisé avant comparaison,
  // comme le fait déjà le test du séparateur de milliers ci-dessus.
  function normalizeSpaces(value: string): string {
    return value.replace(/[\s\u00a0\u202f]/gu, " ");
  }

  it("formate un montant JPY (0 décimale, aucune subdivision) — la plus petite unité est le yen", () => {
    expect(
      new Intl.NumberFormat("fr-CH", { style: "currency", currency: "JPY" }).resolvedOptions()
        .maximumFractionDigits,
    ).toBe(0);
    expect(normalizeSpaces(formatMoney(7, "JPY", "fr-CH"))).toBe("7 JPY");
    expect(normalizeSpaces(formatMoney(7, "JPY", "en-CH"))).toBe("JPY 7");
  });

  it("formate un montant BHD (3 décimales) — la plus petite unité est le fils (1/1000 BHD)", () => {
    expect(
      new Intl.NumberFormat("fr-CH", { style: "currency", currency: "BHD" }).resolvedOptions()
        .maximumFractionDigits,
    ).toBe(3);
    expect(normalizeSpaces(formatMoney(1234, "BHD", "fr-CH"))).toBe("1.234 BHD");
    expect(normalizeSpaces(formatMoney(1234, "BHD", "en-CH"))).toBe("BHD 1.234");
  });

  it("refuse un code de devise invalide", () => {
    expect(() => formatMoney(100, "chf", "fr-CH")).toThrow(MoneyFormatError);
    expect(() => formatMoney(100, "SWISS", "fr-CH")).toThrow(MoneyFormatError);
  });
});
