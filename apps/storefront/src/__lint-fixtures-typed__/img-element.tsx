import type { ReactElement } from "react";

// Fixture de lint (M2, audit-1.md) : prouve que `@next/next/no-img-element` se déclenche
// réellement sur cette configuration (voir tools/eslint-boundaries.test.mjs). Contrairement aux
// fixtures de frontières (H1, `**/__lint-fixtures__/**`), ce fichier est un TypeScript/TSX valide,
// sans import interdit : il reste dans le graphe TypeScript normal (`tsconfig.json`), avec le
// project service actif (type-aware), d'où le nom de dossier distinct
// (`__lint-fixtures-typed__`, non exclu par les `tsconfig.json` des apps).
//
// Le commentaire `eslint-disable-next-line` garde `pnpm lint` vert au quotidien ; le test dédié
// relance ESLint avec `noInlineConfig: true` pour observer la vraie violation.
export function RawImgFixture(): ReactElement {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/example.png" alt="" />;
}
