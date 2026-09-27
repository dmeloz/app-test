import { describe, expect, it } from "vitest";
import { demoTheme } from "./demo-theme.js";
import { DesignTokenError, tokensToCssVariables } from "./to-css.js";
import type { DesignTokens } from "./types.js";

// L9 (audit-1.md) : `tokensToCssVariables` est injecté tel quel dans un `<style>` via
// `dangerouslySetInnerHTML` (`ThemeStyle.tsx`) — sans risque aujourd'hui (thème statique et interne
// au paquet), mais le moteur est prévu pour des thèmes fournis par un tenant (ADR 0015, L05+). Une
// liste blanche de caractères doit rejeter toute tentative d'évasion CSS/HTML avant ce jour-là.
describe("tokensToCssVariables — liste blanche des valeurs de tokens", () => {
  it("accepte le thème de démonstration réel sans lever d'erreur", () => {
    expect(() => tokensToCssVariables(demoTheme)).not.toThrow();
  });

  it("refuse une valeur qui tente de fermer la balise <style> et d'injecter un <script>", () => {
    const hostileTheme: DesignTokens = {
      ...demoTheme,
      color: { ...demoTheme.color, primary: "red;}</style><script>alert(1)</script>" },
    };
    expect(() => tokensToCssVariables(hostileTheme)).toThrow(DesignTokenError);
  });

  it("refuse une valeur contenant une accolade ou une tentative d'URL javascript:", () => {
    const hostileTheme: DesignTokens = {
      ...demoTheme,
      radius: { ...demoTheme.radius, md: "12px}; background:url(javascript:alert(1))" },
    };
    expect(() => tokensToCssVariables(hostileTheme)).toThrow(DesignTokenError);
  });

  it("refuse une valeur contenant un retour à la ligne (fuite hors de la déclaration)", () => {
    const hostileTheme: DesignTokens = {
      ...demoTheme,
      space: { ...demoTheme.space, md: "16px;\n} body { display:none" },
    };
    expect(() => tokensToCssVariables(hostileTheme)).toThrow(DesignTokenError);
  });

  it("accepte les valeurs légitimes typiques (couleur hex, rgba, famille de police entre guillemets)", () => {
    const legitTheme: DesignTokens = {
      ...demoTheme,
      color: { ...demoTheme.color, primary: "#2f6f4f" },
      shadow: { ...demoTheme.shadow, sm: "0 1px 2px rgba(31, 35, 32, 0.08)" },
      font: { ...demoTheme.font, family: '"Segoe UI", Roboto, sans-serif' },
    };
    expect(() => tokensToCssVariables(legitTheme)).not.toThrow();
  });
});
