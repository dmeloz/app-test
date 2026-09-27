import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";
const MIN_SIZE = 44;

// M1 (audit-1.md, spec P01 §2 : « cibles tactiles ≥ 44×44 px ») : mesure réelle
// (`getBoundingClientRect()`) de chaque `button`, `a` et `label[for]` **visible** sur l'écran donné.
// `label[for]` (pas tout `<label>`) : seuls ceux explicitement associés à un contrôle par `for`/`id`
// sont une cible tactile mesurable de façon fiable (un `<label>` qui enveloppe son contrôle sans
// attribut `for`, ex. la case « dès que possible », est déjà couvert par la taille de son parent
// `.ui-slot`).
async function assertAllTouchTargetsAreLargeEnough(page: Page, screenName: string): Promise<void> {
  const handles = await page.locator("button, a, label[for]").all();
  const failures: string[] = [];
  for (const handle of handles) {
    if (!(await handle.isVisible())) {
      continue;
    }
    const box = await handle.boundingBox();
    if (!box) {
      continue;
    }
    if (box.width < MIN_SIZE || box.height < MIN_SIZE) {
      const description = ((await handle.textContent()) ?? "").trim().slice(0, 40);
      const tag = await handle.evaluate((el) => el.tagName.toLowerCase());
      failures.push(
        `<${tag}> "${description}" : ${box.width.toFixed(1)}×${box.height.toFixed(1)} px`,
      );
    }
  }
  expect(
    failures,
    `Cibles tactiles < 44×44 px sur ${screenName} :\n${failures.join("\n")}`,
  ).toEqual([]);
}

test.use({ viewport: { width: 375, height: 812 } });

test.describe("cibles tactiles ≥ 44×44 px (M1, audit-1.md)", () => {
  test("storefront — accueil", async ({ page }) => {
    await page.goto(`${STOREFRONT_URL}/fr`);
    await page.waitForLoadState("networkidle");
    await assertAllTouchTargetsAreLargeEnough(page, "accueil");
  });

  test("storefront — menu (groupes d'options obligatoire + facultatif visibles)", async ({
    page,
  }) => {
    await page.goto(`${STOREFRONT_URL}/fr`);
    await page.getByRole("button", { name: "Retrait" }).click();
    await page.waitForLoadState("networkidle");
    await assertAllTouchTargetsAreLargeEnough(page, "menu");
  });

  test("storefront — panier (livraison, article ajouté, créneaux visibles, formulaire invité)", async ({
    page,
  }) => {
    await page.goto(`${STOREFRONT_URL}/fr`);
    await page.getByRole("button", { name: "Livraison" }).click();
    await page.waitForLoadState("networkidle");
    const soupCard = page.locator("article", { hasText: "Salade de saison" });
    await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.getByRole("link", { name: "Voir le panier" }).click();
    await page.getByLabel("Dès que possible").uncheck();
    await page.waitForLoadState("networkidle");
    await assertAllTouchTargetsAreLargeEnough(page, "panier (livraison, rempli)");
  });

  test("storefront — paiement simulé (panier non vide)", async ({ page }) => {
    await page.goto(`${STOREFRONT_URL}/fr`);
    await page.getByRole("button", { name: "Retrait" }).click();
    const soupCard = page.locator("article", { hasText: "Salade de saison" });
    await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.getByRole("link", { name: "Voir le panier" }).click();
    await page.getByRole("button", { name: "Payer" }).click();
    await page.waitForLoadState("networkidle");
    await assertAllTouchTargetsAreLargeEnough(page, "paiement");
  });

  test("storefront — suivi (commande en cours)", async ({ page }) => {
    await page.goto(`${STOREFRONT_URL}/fr`);
    await page.getByRole("button", { name: "Retrait" }).click();
    const soupCard = page.locator("article", { hasText: "Salade de saison" });
    await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.getByRole("link", { name: "Voir le panier" }).click();
    await page.getByRole("button", { name: "Payer" }).click();
    await page.getByRole("button", { name: "Confirmer le paiement (démonstration)" }).click();
    await page.waitForLoadState("networkidle");
    await assertAllTouchTargetsAreLargeEnough(page, "suivi");
  });

  test("backoffice — tableau de service (commande arrivée, formulaire de refus ouvert)", async ({
    page,
  }) => {
    await page.goto(`${BACKOFFICE_URL}/fr`);
    await expect(page.getByRole("article").first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Refuser" }).first().click();
    await page.waitForLoadState("networkidle");
    await assertAllTouchTargetsAreLargeEnough(page, "tableau de service (formulaire de refus)");
  });
});
