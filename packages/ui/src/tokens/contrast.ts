// Calcul de contraste WCAG 2.x (relative luminance + contrast ratio), utilisé pour prouver
// automatiquement le contraste AA du thème de démonstration (ADR 0015 : « contraste AA calculé »).
// Pur, sans dépendance — testable indépendamment du rendu.
const HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;

export class ContrastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContrastError";
  }
}

function hexToRgb(hex: string): readonly [number, number, number] {
  const match = HEX_PATTERN.exec(hex);
  if (!match) {
    throw new ContrastError(`Couleur hexadécimale invalide (attendu #rrggbb) : "${hex}".`);
  }
  const value = match[1] ?? "";
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return [r, g, b];
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Ratio de contraste WCAG entre deux couleurs (1 à 21). */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Seuils WCAG 2.1 AA : 4.5:1 pour le texte normal, 3:1 pour le grand texte (≥ 18pt / 14pt gras) et
 * les composants d'interface / éléments graphiques.
 */
export function meetsAA(
  foreground: string,
  background: string,
  options?: { readonly large?: boolean },
): boolean {
  const threshold = options?.large ? 3 : 4.5;
  return contrastRatio(foreground, background) >= threshold;
}
