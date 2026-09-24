// Configuration ESLint (flat config) partagée du monorepo.
// Règles de frontières (ADR 0001) : une app n'importe pas une autre app ; un paquet n'importe pas
// une app ; `packages/domain` reste pur (aucun framework).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";
import globals from "globals";

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
    files: ["**/*.config.{ts,mts,cts}", "e2e/**/*.ts", "apps/api/test/**/*.ts"],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
