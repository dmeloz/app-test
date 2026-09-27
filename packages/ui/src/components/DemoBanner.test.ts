import { describe, expect, expectTypeOf, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DemoBanner, type DemoBannerProps } from "./DemoBanner.js";

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

  it("n'accepte aucune prop de fermeture (contrat TypeScript, L6 audit-1.md)", () => {
    // Vraie vérification de type (contrairement à l'ancienne assertion `["text"] === ["text"]`,
    // toujours vraie même en ajoutant un champ `onClose`) : `DemoBannerProps` doit être exactement
    // `{ readonly text: string }`, ni plus ni moins. `tsc --noEmit` (via `pnpm typecheck`) inclut ce
    // fichier de test (`tsconfig.json` du paquet) : une régression ferait échouer le typecheck, pas
    // seulement ce test à l'exécution.
    expectTypeOf<DemoBannerProps>().toEqualTypeOf<{ readonly text: string }>();
  });
});
