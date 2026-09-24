import { describe, expect, it } from "vitest";
import { getDictionary, isSupportedLocale } from "./dictionary";

describe("dictionary (backoffice)", () => {
  it("fournit le texte FR attendu", () => {
    expect(getDictionary("fr").title).toBe("Back-office");
  });

  it("fournit le texte EN attendu", () => {
    expect(getDictionary("en").title).toBe("Back office");
  });

  it("reconnaît uniquement fr et en comme locales supportées", () => {
    expect(isSupportedLocale("fr")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("de")).toBe(false);
  });
});
