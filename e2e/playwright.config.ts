import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// Environnement de développement fourni avec un Chromium préinstallé hors du chemin par défaut de
// Playwright : on le réutilise s'il existe, sinon on laisse Playwright résoudre son navigateur habituel.
const PRE_INSTALLED_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath = existsSync(PRE_INSTALLED_CHROMIUM) ? PRE_INSTALLED_CHROMIUM : undefined;

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
      command: "pnpm --filter storefront build && pnpm --filter storefront start",
      url: STOREFRONT_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: "..",
    },
    {
      command: "pnpm --filter backoffice build && pnpm --filter backoffice start",
      url: BACKOFFICE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: "..",
    },
  ],
});
