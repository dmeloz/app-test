import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// AC-L00-09 (toujours valable au lot P01) : les pages storefront et backoffice répondent 200 en FR
// (/fr) et EN (/en). Contenu mis à jour pour la maquette P01 (spec, écrans 1 et 4) — le storefront
// n'affiche plus la page « Bientôt disponible » du lot L00.
test.describe("storefront", () => {
  test("FR (/fr) répond 200 et affiche l'accueil du restaurant fictif", async ({ page }) => {
    const response = await page.goto(`${STOREFRONT_URL}/fr`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Le Belvédère Imaginaire", level: 1 }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page).toHaveTitle("Le Belvédère Imaginaire");
  });

  test("EN (/en) répond 200 et affiche l'accueil du restaurant fictif", async ({ page }) => {
    const response = await page.goto(`${STOREFRONT_URL}/en`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Le Belvédère Imaginaire", level: 1 }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Le Belvédère Imaginaire");
  });
});

test.describe("backoffice", () => {
  test("FR (/fr) répond 200 et affiche le tableau de service", async ({ page }) => {
    const response = await page.goto(`${BACKOFFICE_URL}/fr`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Tableau de service", level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page).toHaveTitle("Back-office — Le Belvédère Imaginaire");
  });

  test("EN (/en) répond 200 et affiche le tableau de service", async ({ page }) => {
    const response = await page.goto(`${BACKOFFICE_URL}/en`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Service board", level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Back office — Le Belvédère Imaginaire");
  });
});
