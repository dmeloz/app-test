import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// AC-P01-09 : aucune violation axe « serious » ou « critical » sur les 4 écrans de la maquette
// (accueil, menu, panier/créneau — dont paiement simulé et suivi font partie du même écran selon la
// spec §2 —, tableau de service).
// L4 (audit-1.md) : FR **et** EN (pas seulement FR) — un `lang` incohérent ou un libellé ARIA
// manquant côté EN ne serait sinon jamais détecté.
const SCREENS = [
  { name: "storefront FR — accueil", url: `${STOREFRONT_URL}/fr` },
  { name: "storefront FR — menu", url: `${STOREFRONT_URL}/fr/menu` },
  { name: "storefront FR — panier et créneau", url: `${STOREFRONT_URL}/fr/panier` },
  { name: "storefront FR — paiement simulé", url: `${STOREFRONT_URL}/fr/paiement` },
  { name: "storefront FR — suivi", url: `${STOREFRONT_URL}/fr/suivi` },
  { name: "storefront EN — home", url: `${STOREFRONT_URL}/en` },
  { name: "storefront EN — menu", url: `${STOREFRONT_URL}/en/menu` },
  { name: "storefront EN — cart and time slot", url: `${STOREFRONT_URL}/en/panier` },
  { name: "storefront EN — simulated payment", url: `${STOREFRONT_URL}/en/paiement` },
  { name: "storefront EN — tracking", url: `${STOREFRONT_URL}/en/suivi` },
  { name: "backoffice FR — tableau de service", url: `${BACKOFFICE_URL}/fr` },
  { name: "backoffice EN — service board", url: `${BACKOFFICE_URL}/en` },
];

test.use({ viewport: { width: 375, height: 812 } });

async function assertNoSeriousOrCriticalViolations(
  page: import("@playwright/test").Page,
): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const seriousOrCritical = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(
    seriousOrCritical,
    seriousOrCritical
      .map((violation) => `${violation.id} (${violation.impact}) : ${violation.help}`)
      .join("\n"),
  ).toHaveLength(0);
}

for (const screen of SCREENS) {
  test(`${screen.name} : aucune violation axe serious/critical (état vide)`, async ({ page }) => {
    await page.goto(screen.url);
    // Laisse le temps à l'amorçage du tableau de service (backoffice) et à l'hydratation.
    await page.waitForLoadState("networkidle");
    await assertNoSeriousOrCriticalViolations(page);
  });
}

// L4 (audit-1.md) : états remplis — un groupe d'options affiché, une liste de créneaux, un
// formulaire de refus ouvert peuvent introduire des soucis d'accessibilité absents de l'état vide
// (ex. libellés dupliqués, focus perdu) : jamais vérifiés avant cette correction.
test.describe("états remplis (FR et EN)", () => {
  test("storefront FR — menu avec barre de panier visible (article ajouté)", async ({ page }) => {
    await page.goto(`${STOREFRONT_URL}/fr`);
    await page.getByRole("button", { name: "Retrait" }).click();
    const card = page.locator("article", { hasText: "Salade de saison" });
    await card.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.waitForLoadState("networkidle");
    await assertNoSeriousOrCriticalViolations(page);
  });

  test("storefront EN — cart with delivery fee, minimum warning and time slots", async ({
    page,
  }) => {
    await page.goto(`${STOREFRONT_URL}/en`);
    await page.getByRole("button", { name: "Delivery" }).click();
    const card = page.locator("article", { hasText: "Seasonal salad" });
    await card.getByRole("button", { name: "Add to cart" }).click();
    await page.getByRole("link", { name: "View cart" }).click();
    await page.getByLabel("As soon as possible").uncheck();
    await page.waitForLoadState("networkidle");
    await assertNoSeriousOrCriticalViolations(page);
  });

  test("storefront FR — paiement avec panier non vide", async ({ page }) => {
    await page.goto(`${STOREFRONT_URL}/fr`);
    await page.getByRole("button", { name: "Retrait" }).click();
    const card = page.locator("article", { hasText: "Salade de saison" });
    await card.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.getByRole("link", { name: "Voir le panier" }).click();
    await page.getByRole("button", { name: "Payer" }).click();
    await page.waitForLoadState("networkidle");
    await assertNoSeriousOrCriticalViolations(page);
  });

  test("storefront EN — tracking with an order in progress", async ({ page }) => {
    await page.goto(`${STOREFRONT_URL}/en`);
    await page.getByRole("button", { name: "Pickup" }).click();
    const card = page.locator("article", { hasText: "Seasonal salad" });
    await card.getByRole("button", { name: "Add to cart" }).click();
    await page.getByRole("link", { name: "View cart" }).click();
    await page.getByRole("button", { name: "Pay" }).click();
    await page.getByRole("button", { name: "Confirm payment (demo)" }).click();
    await page.waitForLoadState("networkidle");
    await assertNoSeriousOrCriticalViolations(page);
  });

  test("backoffice FR — tableau de service avec commande et formulaire de refus", async ({
    page,
  }) => {
    await page.goto(`${BACKOFFICE_URL}/fr`);
    await page.getByRole("article").first().waitFor({ timeout: 10_000 });
    await page.getByRole("button", { name: "Refuser" }).first().click();
    await page.waitForLoadState("networkidle");
    await assertNoSeriousOrCriticalViolations(page);
  });

  test("backoffice EN — service board with order and refusal form", async ({ page }) => {
    await page.goto(`${BACKOFFICE_URL}/en`);
    await page.getByRole("article").first().waitFor({ timeout: 10_000 });
    await page.getByRole("button", { name: "Refuse" }).first().click();
    await page.waitForLoadState("networkidle");
    await assertNoSeriousOrCriticalViolations(page);
  });
});
