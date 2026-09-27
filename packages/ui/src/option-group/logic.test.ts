import { describe, expect, it } from "vitest";
import {
  canSelectMore,
  getInitialSelection,
  isSelectionValid,
  selectionSurchargeCents,
  toggleSelection,
  type OptionGroupConfig,
} from "./logic.js";

const cuisson: OptionGroupConfig = {
  id: "cuisson",
  label: "Cuisson",
  min: 1,
  max: 1,
  choices: [
    { id: "saignant", label: "Saignant", priceCents: 0 },
    { id: "a-point", label: "À point", priceCents: 0 },
    { id: "bien-cuit", label: "Bien cuit", priceCents: 0 },
  ],
};

const supplements: OptionGroupConfig = {
  id: "supplements",
  label: "Suppléments",
  min: 0,
  max: 2,
  choices: [
    { id: "fromage", label: "Fromage", priceCents: 250 },
    { id: "bacon", label: "Bacon", priceCents: 300 },
    { id: "avocat", label: "Avocat", priceCents: 200 },
  ],
};

describe("getInitialSelection — AC-P01-05", () => {
  it("ne présélectionne jamais un choix, même pour un groupe obligatoire (min=1)", () => {
    expect(getInitialSelection(cuisson)).toEqual([]);
  });

  it("ne présélectionne jamais un supplément payant", () => {
    expect(getInitialSelection(supplements)).toEqual([]);
  });
});

describe("toggleSelection — AC-P01-04", () => {
  it("un groupe min=1 : aucune sélection ne valide pas l'ajout au panier", () => {
    const selection = getInitialSelection(cuisson);
    expect(isSelectionValid(cuisson, selection)).toBe(false);
  });

  it("un groupe min=1 max=1 : sélectionner un choix remplace le précédent (radio)", () => {
    let selection = toggleSelection(cuisson, [], "saignant");
    expect(selection).toEqual(["saignant"]);
    selection = toggleSelection(cuisson, selection, "bien-cuit");
    expect(selection).toEqual(["bien-cuit"]);
    expect(isSelectionValid(cuisson, selection)).toBe(true);
  });

  it("un groupe max=2 : une 3ᵉ sélection est ignorée (sélection inchangée)", () => {
    let selection = toggleSelection(supplements, [], "fromage");
    selection = toggleSelection(supplements, selection, "bacon");
    expect(selection).toEqual(["fromage", "bacon"]);
    expect(canSelectMore(supplements, selection)).toBe(false);

    const afterThirdAttempt = toggleSelection(supplements, selection, "avocat");
    expect(afterThirdAttempt).toEqual(["fromage", "bacon"]);
  });

  it("retirer un choix déjà sélectionné reste toujours possible, même au maximum", () => {
    const atMax = ["fromage", "bacon"];
    const afterRemoval = toggleSelection(supplements, atMax, "fromage");
    expect(afterRemoval).toEqual(["bacon"]);
  });

  it("un groupe optionnel (min=0) valide une sélection vide", () => {
    expect(isSelectionValid(supplements, [])).toBe(true);
  });
});

describe("selectionSurchargeCents", () => {
  it("additionne les suppléments sélectionnés (affichage uniquement)", () => {
    const selection = toggleSelection(supplements, ["fromage"], "bacon");
    expect(selectionSurchargeCents(supplements, selection)).toBe(550);
  });

  it("vaut zéro sans sélection", () => {
    expect(selectionSurchargeCents(supplements, [])).toBe(0);
  });
});
