import type { DesignTokens } from "./types.js";

// Thème de démonstration (lot P01, ADR 0015). Couleurs choisies puis vérifiées automatiquement
// (`demo-theme.test.ts`) pour un contraste AA (≥ 4.5:1 texte normal, ≥ 3:1 grands textes/éléments
// d'interface) — inspiration R1 (`docs/design/inspirations.md`) : cartes de statut colorées et
// pilules, sans effet « glass » ni animation coûteuse (contraste et sobriété priment).
export const demoTheme: DesignTokens = {
  color: {
    bg: "#ffffff",
    surface: "#f6f5f2",
    surfaceAlt: "#ececea",
    text: "#1f2320",
    textMuted: "#52584f",
    border: "#d8d5cc",
    primary: "#2f6f4f",
    primaryDark: "#24593e",
    primaryContrast: "#ffffff",
    danger: "#b3261e",
    dangerContrast: "#ffffff",
    focusRing: "#1d5fbf",
    banner: {
      bg: "#ffd166",
      text: "#3a2600",
    },
    status: {
      new: { bg: "#1d5fbf", text: "#ffffff" },
      preparing: { bg: "#a15a00", text: "#ffffff" },
      ready: { bg: "#1f7a43", text: "#ffffff" },
      paused: { bg: "#5b5f66", text: "#ffffff" },
      refused: { bg: "#b3261e", text: "#ffffff" },
    },
  },
  radius: {
    sm: "6px",
    md: "12px",
    lg: "20px",
    pill: "999px",
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  font: {
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sizeSm: "0.875rem",
    sizeMd: "1rem",
    sizeLg: "1.25rem",
    sizeXl: "1.75rem",
    weightRegular: "400",
    weightBold: "700",
  },
  shadow: {
    sm: "0 1px 2px rgba(31, 35, 32, 0.08)",
    md: "0 4px 12px rgba(31, 35, 32, 0.12)",
  },
  // `.claude/rules/frontend.md` : cibles tactiles ≥ 24×24 px CSS (viser 44×44) ; AC-P01 vise 44px.
  minTapTarget: "44px",
};
