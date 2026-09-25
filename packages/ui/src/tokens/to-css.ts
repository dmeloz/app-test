import type { DesignTokens } from "./types.js";

// Convertit récursivement un objet de tokens en variables CSS `--a-b-c: valeur;` (camelCase →
// kebab-case), conformément à ADR 0015 (« thème = document JSON ... converti en variables CSS »).
function toKebabCase(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function flatten(value: unknown, path: readonly string[], out: Map<string, string>): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === "string" || typeof value === "number") {
    out.set(path.map(toKebabCase).join("-"), String(value));
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
  variables.set("min-tap-target", tokens.minTapTarget);

  const lines = Array.from(variables.entries())
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");
  return `:root {\n${lines}\n}`;
}
