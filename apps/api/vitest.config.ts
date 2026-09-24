import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// NestJS s'appuie sur `emitDecoratorMetadata` (reflect-metadata) pour l'injection de dépendances.
// Le transform TypeScript par défaut de Vitest (esbuild) ne calcule pas ces métadonnées : on utilise
// SWC (recette officielle NestJS) pour que les tests d'intégration légers (TestingModule) fonctionnent.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    root: ".",
  },
  plugins: [swc.vite()],
});
