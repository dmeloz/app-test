import type { ConsoleMessage } from "@playwright/test";
import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// M3 (audit-1.md) : un état `localStorage` de mauvaise forme ne doit plus casser le rendu (la page
// d'erreur Next par défaut violait la CSP — « Refused to apply inline style ») : la page se rend
// normalement, sans aucune erreur console, et la clé corrompue est purgée.
test.describe("localStorage corrompu — récupération propre (M3, audit-1.md)", () => {
  test("storefront /fr/panier : `lines` non-tableau → page rendue proprement, 0 erreur console, clé purgée", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message: ConsoleMessage) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error: Error) => {
      pageErrors.push(error.message);
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("demo-storefront-state-v1", JSON.stringify({ lines: "oops" }));
    });

    await page.goto(`${STOREFRONT_URL}/fr/panier`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Panier et créneau", level: 1 })).toBeVisible();
    await expect(page.getByText("Votre panier de démonstration est vide.")).toBeVisible();

    const storedValue = await page.evaluate(() =>
      window.localStorage.getItem("demo-storefront-state-v1"),
    );
    expect(storedValue).toBeNull();

    expect(consoleErrors, `Erreurs console : ${consoleErrors.join("\n")}`).toHaveLength(0);
    expect(pageErrors, `Erreurs JS non interceptées : ${pageErrors.join("\n")}`).toHaveLength(0);
  });

  test("storefront /fr/menu : JSON invalide → page rendue proprement, 0 erreur console", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message: ConsoleMessage) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error: Error) => {
      pageErrors.push(error.message);
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("demo-storefront-state-v1", "{ ceci n'est pas du JSON");
    });

    await page.goto(`${STOREFRONT_URL}/fr/menu`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Menu", level: 1 })).toBeVisible();

    expect(consoleErrors, `Erreurs console : ${consoleErrors.join("\n")}`).toHaveLength(0);
    expect(pageErrors, `Erreurs JS non interceptées : ${pageErrors.join("\n")}`).toHaveLength(0);
  });

  test("backoffice /fr : `orders` non-tableau → page rendue proprement, 0 erreur console, clé purgée", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message: ConsoleMessage) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error: Error) => {
      pageErrors.push(error.message);
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("demo-backoffice-state-v1", JSON.stringify({ orders: "oops" }));
    });

    await page.goto(`${BACKOFFICE_URL}/fr`);

    await expect(page.getByRole("heading", { name: "Tableau de service", level: 1 })).toBeVisible();

    // La clé corrompue est purgée dès le chargement du module, avant même l'amorçage automatique
    // (300 ms) d'une commande fictive — vérifié ici avant cet amorçage pour ne pas confondre « clé
    // purgée » avec « clé réécrite par la suite avec un état valide » (comportement normal une fois
    // qu'une commande arrive).
    const storedValueRightAfterLoad = await page.evaluate(() =>
      window.localStorage.getItem("demo-backoffice-state-v1"),
    );
    expect(storedValueRightAfterLoad).toBeNull();

    // L'amorçage automatique doit toujours fonctionner après la purge (démonstration non cassée).
    await expect(page.getByRole("article").first()).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    expect(consoleErrors, `Erreurs console : ${consoleErrors.join("\n")}`).toHaveLength(0);
    expect(pageErrors, `Erreurs JS non interceptées : ${pageErrors.join("\n")}`).toHaveLength(0);
  });
});

test.describe("bouton « Réinitialiser la démo » (M3, audit-1.md)", () => {
  test("storefront : visible en FR/EN, remet le panier à zéro", async ({ page }) => {
    await page.goto(`${STOREFRONT_URL}/fr`);
    await expect(page.getByRole("button", { name: "Réinitialiser la démo" })).toBeVisible();

    await page.getByRole("button", { name: "Retrait" }).click();
    const soupCard = page.locator("article", { hasText: "Salade de saison" });
    await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.getByRole("link", { name: "Voir le panier" }).click();
    await expect(page.getByText("Votre panier de démonstration est vide.")).toHaveCount(0);

    await page.getByRole("button", { name: "Réinitialiser la démo" }).click();
    await expect(page).toHaveURL(`${STOREFRONT_URL}/fr`);
    const storedValue = await page.evaluate(() =>
      window.localStorage.getItem("demo-storefront-state-v1"),
    );
    expect(JSON.parse(storedValue ?? "{}")).toMatchObject({ lines: [], channel: null });

    await page.goto(`${STOREFRONT_URL}/en`);
    await expect(page.getByRole("button", { name: "Reset demo" })).toBeVisible();
  });

  test("backoffice : visible en FR/EN, remet le tableau à zéro", async ({ page }) => {
    await page.goto(`${BACKOFFICE_URL}/fr`);
    await expect(page.getByRole("button", { name: "Réinitialiser la démo" })).toBeVisible();
    await expect(page.getByRole("article").first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Réinitialiser la démo" }).click();
    await expect(page.getByRole("article")).toHaveCount(0);

    await page.goto(`${BACKOFFICE_URL}/en`);
    await expect(page.getByRole("button", { name: "Reset demo" })).toBeVisible();
  });
});
