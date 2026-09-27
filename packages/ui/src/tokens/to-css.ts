import type { DesignTokens } from "./types.js";

// Convertit récursivement un objet de tokens en variables CSS `--a-b-c: valeur;` (camelCase →
// kebab-case), conformément à ADR 0015 (« thème = document JSON ... converti en variables CSS »).
function toKebabCase(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export class DesignTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DesignTokenError";
  }
}

// L9 (audit-1.md) : `tokensToCssVariables` est injecté tel quel dans un `<style>` via
// `dangerouslySetInnerHTML` (`ThemeStyle.tsx`) — sans risque aujourd'hui (thème statique du paquet),
// mais le moteur est prévu pour des thèmes fournis par un tenant (ADR 0015, L05+). Liste blanche des
// caractères autorisés dans une valeur de token CSS : lettres, chiffres et la ponctuation courante des
// valeurs CSS (couleurs hex, `rgba(...)`, longueurs, familles de police entre guillemets). Exclut
// délibérément `;`, `{`, `}`, `<`, `>`, `:`, `\`, `@`, `=`, le retour à la ligne, etc. — tout ce qui
// permettrait de sortir de la déclaration `--nom: valeur;` ou de la balise `<style>` elle-même
// (ex. `red;}</style><script>...`).
const SAFE_TOKEN_VALUE_PATTERN = /^[A-Za-z0-9#%.,()\-+_ '"/]*$/;

function assertSafeTokenValue(name: string, value: string): void {
  if (!SAFE_TOKEN_VALUE_PATTERN.test(value)) {
    throw new DesignTokenError(
      `Valeur de token CSS refusée pour "--${name}" : caractère non autorisé (attendu lettres, ` +
        `chiffres, et ()%.,-+_'"/ uniquement) — reçu ${JSON.stringify(value)}.`,
    );
  }
}

function flatten(value: unknown, path: readonly string[], out: Map<string, string>): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === "string" || typeof value === "number") {
    const name = path.map(toKebabCase).join("-");
    const stringValue = String(value);
    assertSafeTokenValue(name, stringValue);
    out.set(name, stringValue);
    return;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      flatten(child, [...path, key], out);
    }
  }
}

/** Génère un bloc `:root { --token: valeur; ... }` à partir d'un thème (ADR 0015). */
export function tokensToCssVariables(tokens: DesignTokens): string {
  const variables = new Map<string, string>();
  flatten(tokens.color, ["color"], variables);
  flatten(tokens.radius, ["radius"], variables);
  flatten(tokens.space, ["space"], variables);
  flatten(tokens.font, ["font"], variables);
  flatten(tokens.shadow, ["shadow"], variables);
  flatten(tokens.size, ["size"], variables);
  assertSafeTokenValue("min-tap-target", tokens.minTapTarget);
  variables.set("min-tap-target", tokens.minTapTarget);

  const lines = Array.from(variables.entries())
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");
  return `:root {\n${lines}\n}`;
}
