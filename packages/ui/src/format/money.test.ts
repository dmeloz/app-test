import { describe, expect, it } from "vitest";
import { formatMoney, MoneyFormatError } from "./money.js";

// Valeurs attendues vérifiées contre la sortie réelle de `Intl.NumberFormat` (ICU embarqué dans
// Node) — jamais devinées (règle n°13 du CLAUDE.md). ` ` = espace insécable, ` ` = espace
// fine insécable (séparateur de milliers ICU pour `fr-CH`).
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

  it("gère un grand montant avec le séparateur de milliers attendu par locale", () => {
    expect(formatMoney(123456789, "CHF", "fr-CH")).toBe(
      `1 234 567.89 CHF`,
    );
    expect(formatMoney(123456789, "CHF", "en-CH")).toBe("CHF 1'234'567.89");
  });

  it("refuse un montant non entier (fraction de centime)", () => {
    expect(() => formatMoney(10.5, "CHF", "fr-CH")).toThrow(MoneyFormatError);
  });

  it("refuse un entier non sûr", () => {
    expect(() => formatMoney(Number.MAX_SAFE_INTEGER + 2, "CHF", "fr-CH")).toThrow(
      MoneyFormatError,
    );
  });

  it("refuse un code de devise invalide", () => {
    expect(() => formatMoney(100, "chf", "fr-CH")).toThrow(MoneyFormatError);
    expect(() => formatMoney(100, "SWISS", "fr-CH")).toThrow(MoneyFormatError);
  });
});
