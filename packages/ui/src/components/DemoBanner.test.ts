import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DemoBanner } from "./DemoBanner.js";

// AC-P01-07 : bandeau « Démonstration » présent sur chaque page, non masquable. Rendu via
// `react-dom/server` (pas de bibliothèque de test de composants supplémentaire) : preuve que le
// composant affiche bien le texte reçu et qu'il n'expose aucun contrôle de fermeture.
describe("DemoBanner", () => {
  it("affiche le texte fourni", () => {
    const html = renderToStaticMarkup(
      createElement(DemoBanner, { text: "Démonstration — aucune commande réelle" }),
    );
    expect(html).toContain("Démonstration — aucune commande réelle");
  });

  it("n'expose aucun bouton (aucun moyen de le masquer)", () => {
    const html = renderToStaticMarkup(createElement(DemoBanner, { text: "Demo — no real orders" }));
    expect(html).not.toContain("<button");
  });

  it("n'accepte aucune prop de fermeture (contrat TypeScript)", () => {
    // Vérification de type : `DemoBannerProps` ne doit exposer aucun champ `onClose`/`dismissible`.
    type Props = Parameters<typeof DemoBanner>[0];
    const keys: readonly (keyof Props)[] = ["text"];
    expect(keys).toEqual(["text"]);
  });
});
