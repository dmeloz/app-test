import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// AC-P01-01 : les 4 écrans sont navigables sur un écran de 375 px de large sans défilement
// horizontal — vérifié en mesurant la largeur de défilement réelle du document, pas seulement en
// supposant qu'un CSS mobile-first suffit.
// L4 (audit-1.md) : couverture EN complète côté storefront (pas seulement l'accueil) — le texte
// anglais est parfois plus long (ex. « As soon as possible »), donc pas une simple répétition du
// test FR.
const STOREFRONT_PATHS = ["", "/menu", "/panier", "/paiement", "/suivi"];
const ROUTES = [
  ...STOREFRONT_PATHS.flatMap((path) => [
    { app: "storefront", url: `${STOREFRONT_URL}/fr${path}` },
    { app: "storefront", url: `${STOREFRONT_URL}/en${path}` },
  ]),
  { app: "backoffice", url: `${BACKOFFICE_URL}/fr` },
  { app: "backoffice", url: `${BACKOFFICE_URL}/en` },
];

test.use({ viewport: { width: 375, height: 812 } });

for (const route of ROUTES) {
  test(`${route.app} ${route.url} : aucun défilement horizontal à 375 px`, async ({ page }) => {
    await page.goto(route.url);
    await page.waitForLoadState("networkidle");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      scrollWidth,
      `scrollWidth (${scrollWidth}) dépasse la largeur visible (${clientWidth}) sur ${route.url}`,
    ).toBeLessThanOrEqual(clientWidth);
  });
}

// L4 (audit-1.md) : les routes ci-dessus sont testées à vide (aucun produit, aucun créneau visible,
// aucune commande) — un contenu plus long (options, créneaux, formulaire de refus) pourrait déborder
// alors que l'état vide ne déborde jamais. États remplis, FR et EN.
const FILLED_STATE_CHECKS: ReadonlyArray<{
  readonly name: string;
  readonly run: (page: import("@playwright/test").Page) => Promise<void>;
}> = [
  {
    name: "storefront FR — panier livraison rempli, créneaux visibles",
    run: async (page) => {
      await page.goto(`${STOREFRONT_URL}/fr`);
      await page.getByRole("button", { name: "Livraison" }).click();
      const card = page.locator("article", { hasText: "Salade de saison" });
      await card.getByRole("button", { name: "Ajouter au panier" }).click();
      await page.getByRole("link", { name: "Voir le panier" }).click();
      await page.getByLabel("Dès que possible").uncheck();
    },
  },
  {
    name: "storefront EN — delivery cart filled, slots visible",
    run: async (page) => {
      await page.goto(`${STOREFRONT_URL}/en`);
      await page.getByRole("button", { name: "Delivery" }).click();
      const card = page.locator("article", { hasText: "Seasonal salad" });
      await card.getByRole("button", { name: "Add to cart" }).click();
      await page.getByRole("link", { name: "View cart" }).click();
      await page.getByLabel("As soon as possible").uncheck();
    },
  },
  {
    name: "backoffice FR — commande arrivée, formulaire de refus ouvert",
    run: async (page) => {
      await page.goto(`${BACKOFFICE_URL}/fr`);
      await page.getByRole("article").first().waitFor({ timeout: 10_000 });
      await page.getByRole("button", { name: "Refuser" }).first().click();
    },
  },
  {
    name: "backoffice EN — order arrived, refusal form open",
    run: async (page) => {
      await page.goto(`${BACKOFFICE_URL}/en`);
      await page.getByRole("article").first().waitFor({ timeout: 10_000 });
      await page.getByRole("button", { name: "Refuse" }).first().click();
    },
  },
];

for (const check of FILLED_STATE_CHECKS) {
  test(`${check.name} : aucun défilement horizontal à 375 px`, async ({ page }) => {
    await check.run(page);
    await page.waitForLoadState("networkidle");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      scrollWidth,
      `scrollWidth (${scrollWidth}) dépasse la largeur visible (${clientWidth})`,
    ).toBeLessThanOrEqual(clientWidth);
  });
}
