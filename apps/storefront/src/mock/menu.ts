// provisoire — remplacé par packages/contracts au L04
//
// Menu fictif de démonstration. Couvre volontairement : un groupe d'options obligatoire (min=1,
// max=1 — AC-P01-04), un groupe de suppléments payants optionnel (min=0, max=2 — AC-P01-04/05), des
// allergènes visibles (AC-P01-06) et un produit en rupture (grisé, non ajoutable).
import type { MockCategory } from "./types";

export const menu: readonly MockCategory[] = [
  {
    id: "entrees",
    name: { fr: "Entrées", en: "Starters" },
    products: [
      {
        id: "salade-saison",
        name: { fr: "Salade de saison", en: "Seasonal salad" },
        description: {
          fr: "Légumes du marché, vinaigrette maison",
          en: "Market vegetables, house dressing",
        },
        priceCents: 900,
        currency: "CHF",
        allergens: [{ fr: "Moutarde", en: "Mustard" }],
        soldOut: false,
        optionGroups: [],
      },
      {
        id: "soupe-jour",
        name: { fr: "Soupe du jour", en: "Soup of the day" },
        description: { fr: "Recette change chaque jour", en: "Recipe changes daily" },
        priceCents: 700,
        currency: "CHF",
        allergens: [
          { fr: "Céleri", en: "Celery" },
          { fr: "Lait", en: "Milk" },
        ],
        soldOut: true,
        optionGroups: [],
      },
    ],
  },
  {
    id: "plats",
    name: { fr: "Plats", en: "Main dishes" },
    products: [
      {
        id: "entrecote",
        name: { fr: "Entrecôte, frites maison", en: "Rib steak, house fries" },
        description: {
          fr: "Bœuf suisse, choix de cuisson obligatoire",
          en: "Swiss beef, cooking choice required",
        },
        priceCents: 3400,
        currency: "CHF",
        allergens: [],
        soldOut: false,
        optionGroups: [
          {
            id: "cuisson",
            label: { fr: "Cuisson", en: "Cooking" },
            min: 1,
            max: 1,
            choices: [
              { id: "saignant", label: { fr: "Saignant", en: "Rare" }, priceCents: 0 },
              { id: "a-point", label: { fr: "À point", en: "Medium" }, priceCents: 0 },
              { id: "bien-cuit", label: { fr: "Bien cuit", en: "Well done" }, priceCents: 0 },
            ],
          },
          {
            id: "supplements-entrecote",
            label: { fr: "Suppléments", en: "Extras" },
            min: 0,
            max: 2,
            choices: [
              {
                id: "fromage",
                label: { fr: "Fromage fondu", en: "Melted cheese" },
                priceCents: 250,
              },
              { id: "bacon", label: { fr: "Bacon", en: "Bacon" }, priceCents: 300 },
              { id: "avocat", label: { fr: "Avocat", en: "Avocado" }, priceCents: 200 },
            ],
          },
        ],
      },
      {
        id: "risotto-champignons",
        name: { fr: "Risotto aux champignons", en: "Mushroom risotto" },
        description: { fr: "Champignons des bois, parmesan", en: "Wild mushrooms, parmesan" },
        priceCents: 2600,
        currency: "CHF",
        allergens: [{ fr: "Lactose", en: "Lactose" }],
        soldOut: false,
        optionGroups: [
          {
            id: "supplements-risotto",
            label: { fr: "Suppléments", en: "Extras" },
            min: 0,
            max: 2,
            choices: [
              {
                id: "parmesan-extra",
                label: { fr: "Parmesan extra", en: "Extra parmesan" },
                priceCents: 200,
              },
              {
                id: "truffe",
                label: { fr: "Copeaux de truffe", en: "Truffle shavings" },
                priceCents: 450,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "desserts",
    name: { fr: "Desserts", en: "Desserts" },
    products: [
      {
        id: "tarte-noix",
        name: { fr: "Tarte aux noix", en: "Walnut tart" },
        description: { fr: "Recette de la maison", en: "House recipe" },
        priceCents: 850,
        currency: "CHF",
        allergens: [
          { fr: "Gluten", en: "Gluten" },
          { fr: "Fruits à coque", en: "Tree nuts" },
          { fr: "Œufs", en: "Eggs" },
        ],
        soldOut: false,
        optionGroups: [],
      },
    ],
  },
  {
    id: "boissons",
    name: { fr: "Boissons", en: "Drinks" },
    products: [
      {
        id: "eau-petillante",
        name: { fr: "Eau pétillante 50 cl", en: "Sparkling water 50 cl" },
        description: { fr: "", en: "" },
        priceCents: 450,
        currency: "CHF",
        allergens: [],
        soldOut: false,
        optionGroups: [],
      },
    ],
  },
];
