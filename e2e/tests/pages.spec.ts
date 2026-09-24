import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// AC-L00-09 : les pages storefront et backoffice répondent 200 en FR (/fr) et EN (/en).
test.describe("storefront", () => {
  test("FR (/fr) répond 200 et affiche le texte français", async ({ page }) => {
    const response = await page.goto(`${STOREFRONT_URL}/fr`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Bientôt disponible" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    // L4 (audit-1.md) : le titre <title> vient du dictionnaire i18n, pas d'un texte en dur.
    await expect(page).toHaveTitle("Bientôt disponible");
  });

  test("EN (/en) répond 200 et affiche le texte anglais", async ({ page }) => {
    const response = await page.goto(`${STOREFRONT_URL}/en`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Coming soon");
  });
});

test.describe("backoffice", () => {
  test("FR (/fr) répond 200 et affiche le texte français", async ({ page }) => {
    const response = await page.goto(`${BACKOFFICE_URL}/fr`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Back-office" })).toBeVisible();
    // L4 (audit-1.md) : l'attribut `lang` du back-office n'était vérifié par aucun test.
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page).toHaveTitle("Back-office");
  });

  test("EN (/en) répond 200 et affiche le texte anglais", async ({ page }) => {
    const response = await page.goto(`${BACKOFFICE_URL}/en`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Back office" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Back office");
  });
});
