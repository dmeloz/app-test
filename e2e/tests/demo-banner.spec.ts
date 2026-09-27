import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// AC-P01-07 : bandeau « Démonstration — aucune commande réelle » présent sur toutes les routes de la
// maquette, dans les deux langues, et non masquable (aucun bouton de fermeture).
const STOREFRONT_ROUTES = ["", "/menu", "/panier", "/paiement", "/suivi"];
const LOCALES = [
  { code: "fr", text: "Démonstration — aucune commande réelle" },
  { code: "en", text: "Demo — no real orders" },
] as const;

test.describe("bandeau de démonstration — storefront", () => {
  for (const locale of LOCALES) {
    for (const route of STOREFRONT_ROUTES) {
      test(`/${locale.code}${route} affiche le bandeau, non masquable`, async ({ page }) => {
        await page.goto(`${STOREFRONT_URL}/${locale.code}${route}`);
        const banner = page.getByRole("note").filter({ hasText: locale.text });
        await expect(banner).toBeVisible();
        await expect(banner.locator("button")).toHaveCount(0);
      });
    }
  }
});

test.describe("bandeau de démonstration — backoffice", () => {
  for (const locale of LOCALES) {
    test(`/${locale.code} affiche le bandeau, non masquable`, async ({ page }) => {
      await page.goto(`${BACKOFFICE_URL}/${locale.code}`);
      const banner = page.getByRole("note").filter({ hasText: locale.text });
      await expect(banner).toBeVisible();
      await expect(banner.locator("button")).toHaveCount(0);
    });
  }
});
