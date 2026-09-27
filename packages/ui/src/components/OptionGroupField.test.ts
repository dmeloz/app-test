import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OptionGroupField } from "./OptionGroupField.js";
import type { OptionGroupConfig } from "../option-group/logic.js";

// L5 (audit-1.md) : AC-P01-04 exige un test « du composant », pas seulement de la logique pure
// (`option-group/logic.test.ts`) — celui-ci rend réellement `OptionGroupField` et inspecte le
// balisage HTML produit.
const config: OptionGroupConfig = {
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

function render(selected: readonly string[]): string {
  return renderToStaticMarkup(
    createElement(OptionGroupField, {
      config,
      selected,
      onToggle: () => {},
      formatSurcharge: (cents: number) => `+${(cents / 100).toFixed(2)}`,
      hint: "Facultatif — jusqu'à 2 choix",
      includedLabel: "inclus",
    }),
  );
}

describe("OptionGroupField — AC-P01-04 (test du composant)", () => {
  it("désactive le 3e choix une fois le maximum (max=2) atteint", () => {
    const html = render(["fromage", "bacon"]);
    const avocatInput = /<input[^>]*id="supplements-avocat"[^>]*>/.exec(html)?.[0];
    expect(avocatInput).toBeDefined();
    expect(avocatInput).toContain("disabled");

    const fromageInput = /<input[^>]*id="supplements-fromage"[^>]*>/.exec(html)?.[0];
    expect(fromageInput).toBeDefined();
    expect(fromageInput).not.toContain("disabled");
  });

  it("laisse les choix restants actifs sous le maximum (1 sur 2)", () => {
    const html = render(["fromage"]);
    for (const id of ["fromage", "bacon", "avocat"]) {
      const input = new RegExp(`<input[^>]*id="supplements-${id}"[^>]*>`).exec(html)?.[0];
      expect(input, `input "${id}" introuvable`).toBeDefined();
      expect(input, `input "${id}" ne devrait pas être désactivé`).not.toContain("disabled");
    }
  });

  it("n'affiche aucune case pré-cochée (AC-P01-05, contre-épreuve du composant)", () => {
    const html = render([]);
    expect(html).not.toContain('checked=""');
  });
});
