import { describe, expect, it } from "vitest";
import { DELIVERY_FEE_CENTS, MINIMUM_ORDER_FOR_DELIVERY_CENTS } from "../mock/delivery";
import { menu } from "../mock/menu";
import {
  areRequiredSelectionsValid,
  cartItemCount,
  cartTotalCents,
  deliveryFeeCents,
  findProduct,
  isBelowDeliveryMinimum,
  lineSurchargeCents,
  lineTotalCents,
  lineUnitPriceCents,
  orderTotalCents,
} from "./cart-calculations";

describe("lineSurchargeCents / lineUnitPriceCents", () => {
  const entrecote = findProduct(menu, "entrecote")!;

  it("vaut zéro sans supplément sélectionné", () => {
    expect(lineSurchargeCents(entrecote, [])).toBe(0);
    expect(lineUnitPriceCents(entrecote, [])).toBe(entrecote.priceCents);
  });

  it("additionne les suppléments sélectionnés (fromage 2.50 + bacon 3.00)", () => {
    const selections = [
      { groupId: "cuisson", choiceIds: ["a-point"] },
      { groupId: "supplements-entrecote", choiceIds: ["fromage", "bacon"] },
    ];
    expect(lineSurchargeCents(entrecote, selections)).toBe(550);
    expect(lineUnitPriceCents(entrecote, selections)).toBe(entrecote.priceCents + 550);
  });

  it("ignore un identifiant de choix inconnu (robustesse)", () => {
    const selections = [{ groupId: "supplements-entrecote", choiceIds: ["inexistant"] }];
    expect(lineSurchargeCents(entrecote, selections)).toBe(0);
  });
});

describe("lineTotalCents / cartTotalCents / cartItemCount", () => {
  const entrecote = findProduct(menu, "entrecote")!;
  const eau = findProduct(menu, "eau-petillante")!;

  it("multiplie le prix unitaire par la quantité", () => {
    const line = {
      lineId: "l1",
      productId: entrecote.id,
      quantity: 2,
      selections: [{ groupId: "cuisson", choiceIds: ["saignant"] }],
    };
    expect(lineTotalCents(entrecote, line)).toBe(entrecote.priceCents * 2);
  });

  it("additionne plusieurs lignes de produits différents", () => {
    const lines = [
      {
        lineId: "l1",
        productId: entrecote.id,
        quantity: 1,
        selections: [{ groupId: "cuisson", choiceIds: ["a-point"] }],
      },
      { lineId: "l2", productId: eau.id, quantity: 2, selections: [] },
    ];
    expect(cartTotalCents(menu, lines)).toBe(entrecote.priceCents + eau.priceCents * 2);
    expect(cartItemCount(lines)).toBe(3);
  });

  it("gère le panier vide (cas limite zéro)", () => {
    expect(cartTotalCents(menu, [])).toBe(0);
    expect(cartItemCount([])).toBe(0);
  });

  it("ignore une ligne dont le produit n'existe plus dans le menu (robustesse)", () => {
    const lines = [{ lineId: "l1", productId: "inexistant", quantity: 1, selections: [] }];
    expect(cartTotalCents(menu, lines)).toBe(0);
  });
});

// M2 (audit-1.md) : frais de livraison fictifs (canal livraison uniquement) et minimum de commande
// pour la livraison (spec P01 §2.3 « frais et minimum affichés »).
describe("deliveryFeeCents / orderTotalCents — M2", () => {
  const entrecote = findProduct(menu, "entrecote")!;
  const lines = [
    {
      lineId: "l1",
      productId: entrecote.id,
      quantity: 1,
      selections: [{ groupId: "cuisson", choiceIds: ["a-point"] }],
    },
  ];

  it("vaut zéro au retrait ou sans canal choisi", () => {
    expect(deliveryFeeCents("pickup")).toBe(0);
    expect(deliveryFeeCents(null)).toBe(0);
  });

  it("s'applique uniquement à la livraison", () => {
    expect(deliveryFeeCents("delivery")).toBe(DELIVERY_FEE_CENTS);
  });

  it("le total affiché inclut les frais de livraison quand le canal est livraison", () => {
    const subtotal = cartTotalCents(menu, lines);
    expect(orderTotalCents(menu, lines, "delivery")).toBe(subtotal + DELIVERY_FEE_CENTS);
    expect(orderTotalCents(menu, lines, "pickup")).toBe(subtotal);
  });

  it("panier vide : le sous-total est nul, les frais de livraison s'appliquent quand même au canal choisi", () => {
    expect(orderTotalCents(menu, [], "delivery")).toBe(DELIVERY_FEE_CENTS);
    expect(orderTotalCents(menu, [], "pickup")).toBe(0);
    expect(orderTotalCents(menu, [], null)).toBe(0);
  });
});

describe("isBelowDeliveryMinimum — M2", () => {
  it("jamais atteint au retrait, quel que soit le sous-total", () => {
    expect(isBelowDeliveryMinimum(0, "pickup")).toBe(false);
    expect(isBelowDeliveryMinimum(MINIMUM_ORDER_FOR_DELIVERY_CENTS - 1, "pickup")).toBe(false);
  });

  it("ne s'affiche pas pour un panier vide (aucun produit encore choisi)", () => {
    expect(isBelowDeliveryMinimum(0, "delivery")).toBe(false);
  });

  it("vrai en livraison sous le minimum (cas limite : minimum moins 1 centime)", () => {
    expect(isBelowDeliveryMinimum(MINIMUM_ORDER_FOR_DELIVERY_CENTS - 1, "delivery")).toBe(true);
  });

  it("faux en livraison au minimum exact ou au-dessus (cas limite : minimum exact)", () => {
    expect(isBelowDeliveryMinimum(MINIMUM_ORDER_FOR_DELIVERY_CENTS, "delivery")).toBe(false);
    expect(isBelowDeliveryMinimum(MINIMUM_ORDER_FOR_DELIVERY_CENTS + 1, "delivery")).toBe(false);
  });
});

describe("areRequiredSelectionsValid — AC-P01-04", () => {
  const entrecote = findProduct(menu, "entrecote")!;

  it("refuse sans le choix de cuisson obligatoire (min=1)", () => {
    expect(areRequiredSelectionsValid(entrecote, [])).toBe(false);
  });

  it("accepte avec le choix de cuisson fait, suppléments optionnels absents", () => {
    expect(
      areRequiredSelectionsValid(entrecote, [{ groupId: "cuisson", choiceIds: ["bien-cuit"] }]),
    ).toBe(true);
  });

  it("refuse au-delà du maximum de suppléments (max=2)", () => {
    expect(
      areRequiredSelectionsValid(entrecote, [
        { groupId: "cuisson", choiceIds: ["a-point"] },
        { groupId: "supplements-entrecote", choiceIds: ["fromage", "bacon", "avocat"] },
      ]),
    ).toBe(false);
  });
});
