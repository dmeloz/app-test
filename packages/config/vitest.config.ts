import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Paquet volontairement vide au lot L00 : pas encore de test unitaire à exécuter.
    passWithNoTests: true,
  },
});
