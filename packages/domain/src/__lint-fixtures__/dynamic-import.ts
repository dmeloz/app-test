// Fixture (H1/M8) : packages/domain interdit tout `import()` dynamique (no-restricted-syntax,
// ImportExpression) — contournerait sinon la liste d'interdiction de `no-restricted-imports`.
export async function loadSomething(): Promise<unknown> {
  // eslint-disable-next-line no-restricted-syntax
  return import("node:fs");
}
