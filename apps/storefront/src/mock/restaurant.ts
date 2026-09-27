// provisoire — remplacé par packages/contracts au L04
//
// Restaurant fictif « Le Belvédère Imaginaire » : nom inventé pour la maquette de démonstration P01,
// vérifié (recherche du fil principal, 2026-09-24) pour ne correspondre à aucun établissement réel
// connu. Adresse fictive, sans numéro de rue réel identifiable.
import type { MockRestaurant } from "./types";

export const restaurant: MockRestaurant = {
  name: "Le Belvédère Imaginaire",
  tagline: {
    fr: "Cuisine de saison, retrait et livraison de quartier",
    en: "Seasonal cooking, neighbourhood pickup and delivery",
  },
  address: "Rue de la Démo 1, 1000 Lausanne (fictif)",
  city: "Lausanne",
  openingHours: {
    fr: "Lu–Sa, 11 h 30 – 21 h 30",
    en: "Mon–Sat, 11:30 AM – 9:30 PM",
  },
  isOpen: true,
  estimatedDelayMinutes: 25,
  currency: "CHF",
};
