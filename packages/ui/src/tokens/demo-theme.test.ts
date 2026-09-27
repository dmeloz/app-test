import { describe, expect, it } from "vitest";
import { demoTheme } from "./demo-theme.js";
import { meetsAA } from "./contrast.js";
import { tokensToCssVariables } from "./to-css.js";

// ADR 0015 : « Contraste AA calculé à la publication (blocage si échec) ». Au lot P01, ce calcul est
// exécuté ici comme test unitaire bloquant (pas encore de pipeline de publication de thème — L05+) :
// toute couleur du thème de démonstration doit rester vérifiée automatiquement, jamais seulement à
// l'œil (AC-P01, accessibilité — contraste AA).
describe("demoTheme — contraste AA (ADR 0015)", () => {
  const { color } = demoTheme;

  it("texte principal sur fond et sur surface", () => {
    expect(meetsAA(color.text, color.bg)).toBe(true);
    expect(meetsAA(color.text, color.surface)).toBe(true);
  });

  it("texte atténué sur fond et sur surface", () => {
    expect(meetsAA(color.textMuted, color.bg)).toBe(true);
    expect(meetsAA(color.textMuted, color.surface)).toBe(true);
  });

  it("texte de contraste sur fond primaire (boutons)", () => {
    expect(meetsAA(color.primaryContrast, color.primary)).toBe(true);
    expect(meetsAA(color.primaryContrast, color.primaryDark)).toBe(true);
  });

  it("texte de contraste sur fond danger", () => {
    expect(meetsAA(color.dangerContrast, color.danger)).toBe(true);
  });

  it("texte de la bannière de démonstration", () => {
    expect(meetsAA(color.banner.text, color.banner.bg)).toBe(true);
  });

  it("chaque pilule de statut de commande (texte sur fond)", () => {
    for (const status of Object.values(color.status)) {
      expect(meetsAA(status.text, status.bg)).toBe(true);
    }
  });

  it("anneau de focus visible sur fond clair (seuil non-texte, 3:1)", () => {
    expect(meetsAA(color.focusRing, color.bg, { large: true })).toBe(true);
  });
});

describe("tokensToCssVariables(demoTheme)", () => {
  const css = tokensToCssVariables(demoTheme);

  it("produit un bloc :root avec les variables attendues", () => {
    expect(css.startsWith(":root {")).toBe(true);
    expect(css).toContain(`--color-bg: ${demoTheme.color.bg};`);
    expect(css).toContain(`--color-primary: ${demoTheme.color.primary};`);
    expect(css).toContain(`--color-status-new-bg: ${demoTheme.color.status.new.bg};`);
    expect(css).toContain(`--color-status-ready-text: ${demoTheme.color.status.ready.text};`);
    expect(css).toContain(`--color-banner-bg: ${demoTheme.color.banner.bg};`);
    expect(css).toContain(`--radius-md: ${demoTheme.radius.md};`);
    expect(css).toContain(`--space-lg: ${demoTheme.space.lg};`);
    expect(css).toContain(`--font-size-lg: ${demoTheme.font.sizeLg};`);
    expect(css).toContain(`--shadow-sm: ${demoTheme.shadow.sm};`);
    expect(css).toContain(`--min-tap-target: ${demoTheme.minTapTarget};`);
  });
});
