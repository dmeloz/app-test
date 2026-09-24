// Fixture de lint (M2, audit-1.md) : prouve que `@typescript-eslint/no-floating-promises` se
// déclenche réellement sur cette configuration (voir tools/eslint-boundaries.test.mjs) — fichier
// auto-suffisant (aucun import externe), pour que le type de la promesse soit résolu même par le
// projet TypeScript par défaut inféré pour un fichier hors du graphe d'une app.
async function doSomethingAsync(): Promise<void> {
  await Promise.resolve();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
doSomethingAsync();
