import { describe, expect, it } from "vitest";
import { getDictionary, isSupportedLocale, SUPPORTED_LOCALES } from "./dictionary";

// L8 (audit-1.md) : le nom du restaurant fictif n'est plus dans le dictionnaire (voir
// `mock/restaurant.ts`) — seul le préfixe traduit du titre (« Back-office » / « Back office ») l'est.
describe("dictionary (backoffice)", () => {
  it("fournit le préfixe du titre en FR et EN", () => {
    expect(getDictionary("fr").titlePrefix).toBe("Back-office");
    expect(getDictionary("en").titlePrefix).toBe("Back office");
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

  it("fournit un dictionnaire complet du tableau de service pour chaque locale supportée", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dictionary = getDictionary(locale);
      expect(dictionary.board.heading).toBeTruthy();
      expect(dictionary.board.columnNew).toBeTruthy();
      expect(dictionary.board.columnPreparing).toBeTruthy();
      expect(dictionary.board.columnReady).toBeTruthy();
    }
  });
});
