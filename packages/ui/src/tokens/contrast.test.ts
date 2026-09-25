import { describe, expect, it } from "vitest";
import { contrastRatio, ContrastError, meetsAA } from "./contrast.js";

describe("contrastRatio", () => {
  it("calcule 21:1 pour noir sur blanc (cas limite maximal)", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("calcule 1:1 pour deux couleurs identiques (cas limite minimal)", () => {
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  it("est symétrique (ordre des couleurs sans effet)", () => {
    expect(contrastRatio("#123456", "#fedcba")).toBeCloseTo(
      contrastRatio("#fedcba", "#123456"),
      10,
    );
  });

  it("refuse une couleur hors format #rrggbb", () => {
    expect(() => contrastRatio("blue", "#ffffff")).toThrow(ContrastError);
    expect(() => contrastRatio("#fff", "#ffffff")).toThrow(ContrastError);
  });
});

describe("meetsAA", () => {
  it("accepte un contraste suffisant pour le texte normal (seuil 4.5:1)", () => {
    expect(meetsAA("#1f2320", "#ffffff")).toBe(true);
  });

  it("refuse un contraste insuffisant pour le texte normal", () => {
    expect(meetsAA("#aaaaaa", "#ffffff")).toBe(false);
  });

  it("accepte un contraste de 3:1 seulement pour le grand texte (`large: true`)", () => {
    // Choisi pour être proche de 3:1 sans atteindre 4.5:1.
    expect(meetsAA("#767676", "#ffffff")).toBe(true);
    expect(meetsAA("#767676", "#ffffff", { large: true })).toBe(true);
  });
});
