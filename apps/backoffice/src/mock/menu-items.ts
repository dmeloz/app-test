// provisoire — remplacé par packages/contracts au L04
//
// Sous-ensemble de plats pour la bascule rupture de stock du tableau de service (spec P01 §2).
// Isolé de `apps/storefront/src/mock/menu.ts` (aucune app n'importe les données fictives de l'autre).
import type { MockMenuItem } from "./types";

export const menuItems: readonly MockMenuItem[] = [
  {
    id: "entrecote",
    name: { fr: "Entrecôte, frites maison", en: "Rib steak, house fries" },
    soldOut: false,
  },
  {
    id: "risotto-champignons",
    name: { fr: "Risotto aux champignons", en: "Mushroom risotto" },
    soldOut: false,
  },
  { id: "soupe-jour", name: { fr: "Soupe du jour", en: "Soup of the day" }, soldOut: true },
  { id: "tarte-noix", name: { fr: "Tarte aux noix", en: "Walnut tart" }, soldOut: false },
];
