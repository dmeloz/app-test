import type { ReactElement } from "react";
import { DEMO_STYLESHEET } from "../themes/demo/stylesheet.js";

export interface ThemeStyleProps {
  readonly nonce: string;
}

// Injecte la feuille de style du thème de démonstration via une balise <style nonce=...> (CSP à
// nonce du L00, `src/proxy.ts` des deux apps) — jamais un attribut `style=""` en ligne (non couvert
// par un nonce CSP). À rendre une seule fois, dans le layout racine de chaque app.
export function ThemeStyle({ nonce }: ThemeStyleProps): ReactElement {
  // Feuille de style statique du paquet, jamais de contenu utilisateur ni de donnée fictive
  // (AC-P01-11) : voir `themes/demo/stylesheet.ts`.
  return <style nonce={nonce} dangerouslySetInnerHTML={{ __html: DEMO_STYLESHEET }} />;
}
