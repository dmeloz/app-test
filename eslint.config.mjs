// Configuration ESLint (flat config) partagée du monorepo.
// Règles de frontières (ADR 0001) : une app n'importe pas une autre app ; un paquet n'importe pas
// une app ; `packages/domain` reste pur (aucun framework).
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";
import globals from "globals";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

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
              message: "packages/domain doit rester pur : aucune dépendance à un framework (ADR 0001).",
            },
          ],
        },
      ],
    },
  },
  // Règles Next.js pour les deux apps front (rgles de base uniquement, conflits web vitals via compat).
  ...compat.extends("next/core-web-vitals").map((config) => ({
    ...config,
    files: ["apps/storefront/**/*.{ts,tsx}", "apps/backoffice/**/*.{ts,tsx}"],
  })),
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
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  prettier,
);
