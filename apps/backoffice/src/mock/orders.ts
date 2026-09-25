// provisoire — remplacé par packages/contracts au L04
//
// Réserve de commandes fictives « prêtes à arriver » (spec P01 §2 : « alerte visuelle à l'arrivée
// d'une commande fictive »). `nextIncomingOrder` construit une commande avec un identifiant unique à
// partir d'un modèle, pour permettre de simuler plusieurs arrivées successives pendant une démo.
import type { MockOrder } from "./types";

type OrderTemplate = Omit<MockOrder, "id" | "number" | "status" | "refusalReason">;

const TEMPLATES: readonly OrderTemplate[] = [
  {
    slotLabel: { fr: "18 h 15 – 18 h 30", en: "6:15 – 6:30 PM" },
    lines: [
      {
        name: { fr: "Entrecôte, frites maison", en: "Rib steak, house fries" },
        quantity: 1,
        options: [
          { fr: "À point", en: "Medium" },
          { fr: "Fromage fondu", en: "Melted cheese" },
        ],
      },
      {
        name: { fr: "Eau pétillante 50 cl", en: "Sparkling water 50 cl" },
        quantity: 1,
        options: [],
      },
    ],
    note: { fr: "Sans oignon si possible, merci.", en: "No onion if possible, thanks." },
  },
  {
    slotLabel: { fr: "Dès que possible", en: "As soon as possible" },
    lines: [
      {
        name: { fr: "Risotto aux champignons", en: "Mushroom risotto" },
        quantity: 2,
        options: [{ fr: "Copeaux de truffe", en: "Truffle shavings" }],
      },
    ],
  },
  {
    slotLabel: { fr: "19 h 00 – 19 h 15", en: "7:00 – 7:15 PM" },
    lines: [
      { name: { fr: "Salade de saison", en: "Seasonal salad" }, quantity: 1, options: [] },
      { name: { fr: "Tarte aux noix", en: "Walnut tart" }, quantity: 1, options: [] },
    ],
  },
];

let sequence = 0;

/** Construit une nouvelle commande fictive (identifiant et numéro uniques) à partir de la réserve. */
export function nextIncomingOrder(): MockOrder {
  const template = TEMPLATES[sequence % TEMPLATES.length]!;
  sequence += 1;
  const number = String(100 + sequence);
  return {
    ...template,
    id: `demo-order-${sequence}-${Date.now().toString(36)}`,
    number: `#${number}`,
    status: "new",
  };
}

/** Réinitialise le compteur (tests uniquement — un ordre déterministe simplifie les assertions). */
export function resetOrderSequenceForTests(): void {
  sequence = 0;
}
