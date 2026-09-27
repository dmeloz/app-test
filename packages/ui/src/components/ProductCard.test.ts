import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductCard } from "./ProductCard.js";

// AC-P01-06 : les allergènes sont visibles sur la carte produit avant tout ajout au panier (pas
// derrière un clic supplémentaire).
describe("ProductCard", () => {
  it("affiche les allergènes directement dans le balisage rendu", () => {
    const html = renderToStaticMarkup(
      createElement(ProductCard, {
        name: "Tarte aux noix",
        formattedPrice: "12.50 CHF",
        allergens: ["Gluten", "Fruits à coque"],
        allergensLabel: "Allergènes",
        soldOut: false,
        soldOutLabel: "Rupture",
      }),
    );
    expect(html).toContain("Gluten");
    expect(html).toContain("Fruits à coque");
  });

  it("affiche l'état rupture et masque le contenu enfant (impossible à ajouter)", () => {
    const html = renderToStaticMarkup(
      createElement(
        ProductCard,
        {
          name: "Plat du jour",
          formattedPrice: "18.00 CHF",
          allergens: [],
          allergensLabel: "Allergènes",
          soldOut: true,
          soldOutLabel: "Rupture de stock",
        },
        createElement("button", null, "Ajouter"),
      ),
    );
    expect(html).toContain("Rupture de stock");
    expect(html).not.toContain("Ajouter");
    expect(html).toContain('aria-disabled="true"');
  });

  it("ne présélectionne ni ne masque le prix", () => {
    const html = renderToStaticMarkup(
      createElement(ProductCard, {
        name: "Salade",
        formattedPrice: "9.00 CHF",
        allergens: [],
        allergensLabel: "Allergènes",
        soldOut: false,
        soldOutLabel: "Rupture",
      }),
    );
    expect(html).toContain("9.00 CHF");
  });
});
