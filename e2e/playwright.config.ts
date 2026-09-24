import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const ROOT_DIR = path.resolve(__dirname, "..");
const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";
// `/` redirige vers `/fr` (voir next.config.ts) : on vérifie la disponibilité du serveur sur une
// route qui existe réellement.
const STOREFRONT_READY_URL = `${STOREFRONT_URL}/fr`;
const BACKOFFICE_READY_URL = `${BACKOFFICE_URL}/fr`;

// Environnement de développement fourni avec un Chromium préinstallé hors du chemin par défaut de
// Playwright : on le réutilise s'il existe, sinon on laisse Playwright résoudre son navigateur habituel.
const PRE_INSTALLED_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath = existsSync(PRE_INSTALLED_CHROMIUM) ? PRE_INSTALLED_CHROMIUM : undefined;

// NOTE (écart documenté dans le rapport d'implémentation) : `webServer.command` invoque directement
// le binaire `next` (pas `pnpm run start`, pas de `&&`/build ici). Avec une chaîne shell
// (`pnpm --filter x build && pnpm --filter x start`), Playwright ne tuait que le shell intermédiaire
// à l'arrêt, laissant le processus `next-server` petit-enfant orphelin et bloquant la commande
// indéfiniment après la fin réelle des tests. Le build est fait en amont (`pnpm build` /
// `turbo run build --filter=storefront --filter=backoffice`), invoqué par le script racine `test:e2e`.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    trace: "on-first-retry",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node_modules/.bin/next start --port 3100",
      cwd: path.join(ROOT_DIR, "apps/storefront"),
      url: STOREFRONT_READY_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "node_modules/.bin/next start --port 3101",
      cwd: path.join(ROOT_DIR, "apps/backoffice"),
      url: BACKOFFICE_READY_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
