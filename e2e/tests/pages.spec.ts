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
  });

  test("EN (/en) répond 200 et affiche le texte anglais", async ({ page }) => {
    const response = await page.goto(`${STOREFRONT_URL}/en`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("backoffice", () => {
  test("FR (/fr) répond 200 et affiche le texte français", async ({ page }) => {
    const response = await page.goto(`${BACKOFFICE_URL}/fr`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Back-office" })).toBeVisible();
  });

  test("EN (/en) répond 200 et affiche le texte anglais", async ({ page }) => {
    const response = await page.goto(`${BACKOFFICE_URL}/en`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Back office" })).toBeVisible();
  });
});
