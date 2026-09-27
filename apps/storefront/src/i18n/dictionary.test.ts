import { describe, expect, it } from "vitest";
import { getDictionary, isSupportedLocale, SUPPORTED_LOCALES } from "./dictionary";

// L8 (audit-1.md) : le nom du restaurant fictif n'est plus dans le dictionnaire i18n (texte
// traduisible) mais dans la donnée « tenant » (`mock/restaurant.ts`, `restaurant.name`) — un
// dictionnaire ne doit contenir que du texte d'interface, jamais une donnée métier. Voir
// `restaurant.test.ts` pour la vérification du nom lui-même.
describe("dictionary (storefront)", () => {
  it("fournit le texte du bandeau de démonstration en FR et EN (AC-P01-07)", () => {
    expect(getDictionary("fr").banner).toBe("Démonstration — aucune commande réelle");
    expect(getDictionary("en").banner).toBe("Demo — no real orders");
  });

  it("reconnaît uniquement fr et en comme locales supportées", () => {
    expect(isSupportedLocale("fr")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("de")).toBe(false);
  });

  it("fournit un dictionnaire complet (aucune clé manquante) pour chaque locale supportée", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dictionary = getDictionary(locale);
      expect(dictionary.home.statusOpen).toBeTruthy();
      expect(dictionary.menu.heading).toBeTruthy();
      expect(dictionary.cart.heading).toBeTruthy();
      expect(dictionary.payment.heading).toBeTruthy();
      expect(dictionary.tracking.heading).toBeTruthy();
    }
  });
});
