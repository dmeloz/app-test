// Configuration ESLint (flat config) partagée du monorepo.
// Règles de frontières (ADR 0001) : une app n'importe pas une autre app ; un paquet n'importe pas
// une app ; `packages/domain` reste pur (aucun framework).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import prettier from "eslint-config-prettier";
import globals from "globals";

// M8 : packages/domain doit rester pur — aucune dépendance de production n'y est déclarée
// (`packages/domain/package.json` n'a pas de champ `dependencies`). Cette liste est une défense en
// profondeur au niveau lint (en plus de l'absence de dépendance déclarée) contre les frameworks et
// les SDK d'infrastructure qui pourraient être importés par erreur via un paquet transitif du
// monorepo (résolution de module Node, pas de sandbox runtime).
const FRAMEWORK_IMPORTS_FORBIDDEN_IN_DOMAIN = [
  "@nestjs",
  "@nestjs/*",
  "next",
  "next/*",
  "drizzle-orm",
  "drizzle-orm/*",
  "stripe",
  "ioredis",
  "fastify",
  "@fastify/*",
  "react",
  "react-dom",
  "react/*",
  // M8 (lot L01) : futurs fournisseurs d'infrastructure — base de données, files d'attente, stockage.
  "pg",
  "pg/*",
  "bullmq",
  "bullmq/*",
  "@aws-sdk/*",
];

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "pnpm-lock.yaml",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
    },
    plugins: {
      "import-x": importX,
    },
    settings: {
      // H1 : résolveur TypeScript (extensions .ts/.tsx/.js, chemins relatifs, exports de paquet)
      // — sans lui, `import-x/no-restricted-paths` ignore silencieusement tout import non résolu
      // (voir audit-1.md, constat H1).
      "import-x/resolver-next": [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    rules: {
      // AC-L00-08 : une app n'importe jamais une autre app ; un paquet n'importe jamais une app.
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./apps/storefront",
              from: ["./apps/backoffice", "./apps/api"],
              message: "Une app n'importe pas une autre app (ADR 0001).",
            },
            {
              target: "./apps/backoffice",
              from: ["./apps/storefront", "./apps/api"],
              message: "Une app n'importe pas une autre app (ADR 0001).",
            },
            {
              target: "./apps/api",
              from: ["./apps/storefront", "./apps/backoffice"],
              message: "Une app n'importe pas une autre app (ADR 0001).",
            },
            {
              target: "./packages",
              from: "./apps",
              message: "Un paquet n'importe pas une app (ADR 0001).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: FRAMEWORK_IMPORTS_FORBIDDEN_IN_DOMAIN,
              message:
                "packages/domain doit rester pur : aucune dépendance à un framework (ADR 0001).",
            },
          ],
        },
      ],
      // M8 : `import()` dynamique interdit dans packages/domain (contournerait la liste
      // d'autorisation ci-dessus en dissimulant le nom du module importé dans une expression).
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression",
          message: "packages/domain doit rester pur : import() dynamique interdit (ADR 0001).",
        },
      ],
    },
  },
  // NOTE (écart documenté dans le rapport d'implémentation) : l'intégration `eslint-config-next`
  // via `@eslint/eslintrc` (FlatCompat) provoque une erreur ("Converting circular structure to
  // JSON") avec ESLint 10 / eslint-config-next 16.3.6 dans cet environnement. Reporté à un lot
  // ultérieur ; les règles de frontières et TypeScript strict restent actives sur les deux apps.
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Fichiers de configuration d'outillage et e2e, hors du `include` des tsconfig de paquet :
    // lint syntaxique (pas de vérification de types via le project service TypeScript).
    // `__lint-fixtures__` (H1) : fixtures de test des frontières, volontairement exclues des
    // tsconfig de paquet (voir `tools/eslint-boundaries.test.mjs`) — mêmes raisons.
    files: [
      "**/*.config.{ts,mts,cts}",
      "e2e/**/*.ts",
      "apps/api/test/**/*.ts",
      "**/__lint-fixtures__/**/*.ts",
    ],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
