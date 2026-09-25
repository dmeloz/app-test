import { describe, expect, it } from "vitest";
import { getDictionary, isSupportedLocale, SUPPORTED_LOCALES } from "./dictionary";

describe("dictionary (storefront)", () => {
  it("fournit le titre du site en FR et EN (nom du restaurant fictif)", () => {
    expect(getDictionary("fr").siteTitle).toBe("Le Belvédère Imaginaire");
    expect(getDictionary("en").siteTitle).toBe("Le Belvédère Imaginaire");
  });

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
      expect(dictionary.home.heading).toBeTruthy();
      expect(dictionary.menu.heading).toBeTruthy();
      expect(dictionary.cart.heading).toBeTruthy();
      expect(dictionary.payment.heading).toBeTruthy();
      expect(dictionary.tracking.heading).toBeTruthy();
    }
  });
});
