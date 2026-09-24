// Test automatisé des frontières ESLint (H1, audit-1.md) : relit la VRAIE configuration du
// monorepo (`eslint.config.mjs`) et prouve, pour chaque fixture de `**/__lint-fixtures__/**`, que la
// règle attendue déclenche bien une erreur (`ruleId` + `severity === 2`).
//
// Les fixtures contiennent un commentaire `eslint-disable-next-line` pour que `pnpm lint` (exécuté
// sur tout le dépôt) reste vert en permanence ; ce test relance ESLint avec
// `linterOptions.noInlineConfig: true` pour ignorer ces commentaires et observer la violation
// réelle, exactement comme le ferait un développeur qui n'aurait pas ajouté ce commentaire.
//
// Exécution : `node --test tools/eslint-boundaries.test.mjs` (voir `package.json`,
// script `test:lint-boundaries`).
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { ESLint } from "eslint";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ file: string, ruleId: string, label: string }[]} */
const CASES = [
  {
    file: "apps/storefront/src/__lint-fixtures__/imports-backoffice.ts",
    ruleId: "import-x/no-restricted-paths",
    label: "storefront → backoffice",
  },
  {
    file: "apps/storefront/src/__lint-fixtures__/imports-api.ts",
    ruleId: "import-x/no-restricted-paths",
    label: "storefront → api",
  },
  {
    file: "apps/api/src/__lint-fixtures__/imports-storefront-js.ts",
    ruleId: "import-x/no-restricted-paths",
    label: "api → storefront (cible .js réelle)",
  },
  {
    file: "packages/db/src/__lint-fixtures__/imports-api.ts",
    ruleId: "import-x/no-restricted-paths",
    label: "packages/db → apps/api",
  },
  {
    file: "packages/domain/src/__lint-fixtures__/imports-nestjs.ts",
    ruleId: "no-restricted-imports",
    label: "packages/domain → @nestjs/common",
  },
  {
    file: "packages/domain/src/__lint-fixtures__/imports-pg.ts",
    ruleId: "no-restricted-imports",
    label: "packages/domain → pg (M8)",
  },
  {
    file: "packages/domain/src/__lint-fixtures__/imports-bullmq.ts",
    ruleId: "no-restricted-imports",
    label: "packages/domain → bullmq (M8)",
  },
  {
    file: "packages/domain/src/__lint-fixtures__/imports-aws-sdk.ts",
    ruleId: "no-restricted-imports",
    label: "packages/domain → @aws-sdk/client-s3 (M8)",
  },
  {
    file: "packages/domain/src/__lint-fixtures__/dynamic-import.ts",
    ruleId: "no-restricted-syntax",
    label: "packages/domain → import() dynamique (M8)",
  },
  {
    file: "apps/storefront/src/__lint-fixtures-typed__/img-element.tsx",
    ruleId: "@next/next/no-img-element",
    label: "storefront → <img> brut (M2)",
    // Sévérité du preset `recommended` de `@next/eslint-plugin-next` (avertissement, pas bloquant
    // au lot L00 — pas de règle Core Web Vitals durcie demandée par la spec de ce lot).
    severity: 1,
  },
  {
    file: "apps/storefront/src/__lint-fixtures-typed__/floating-promise.ts",
    ruleId: "@typescript-eslint/no-floating-promises",
    label: "storefront → promesse non attendue (M2)",
  },
];

describe("Frontières ESLint (H1) — fixtures commitées, config réelle", () => {
  for (const { file, ruleId, label, severity = 2 } of CASES) {
    it(`${label} : ${ruleId} (severity ${severity})`, async () => {
      const eslint = new ESLint({
        cwd: ROOT_DIR,
        // Ignore les commentaires eslint-disable des fixtures : on veut voir la vraie violation.
        overrideConfig: { linterOptions: { noInlineConfig: true } },
      });
      const absolutePath = path.join(ROOT_DIR, file);
      const [result] = await eslint.lintFiles([absolutePath]);

      assert.ok(result, `aucun résultat ESLint pour ${file}`);
      const match = result.messages.find((message) => message.ruleId === ruleId);
      assert.ok(
        match,
        `attendu une erreur ${ruleId} sur ${file}, obtenu : ${JSON.stringify(result.messages)}`,
      );
      assert.equal(
        match.severity,
        severity,
        `${ruleId} sur ${file} doit avoir la sévérité ${severity}`,
      );
    });
  }

  it("contre-épreuve : un import interne légitime ne déclenche aucune de ces règles", async () => {
    const eslint = new ESLint({
      cwd: ROOT_DIR,
      overrideConfig: { linterOptions: { noInlineConfig: true } },
    });
    const absolutePath = path.join(ROOT_DIR, "apps/storefront/src/i18n/dictionary.ts");
    const [result] = await eslint.lintFiles([absolutePath]);
    const restrictedRuleIds = new Set([
      "import-x/no-restricted-paths",
      "no-restricted-imports",
      "no-restricted-syntax",
    ]);
    const falsePositives = result.messages.filter((message) =>
      restrictedRuleIds.has(message.ruleId ?? ""),
    );
    assert.deepEqual(falsePositives, []);
  });
});
