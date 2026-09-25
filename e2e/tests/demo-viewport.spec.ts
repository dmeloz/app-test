import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// AC-P01-01 : les 4 écrans sont navigables sur un écran de 375 px de large sans défilement
// horizontal — vérifié en mesurant la largeur de défilement réelle du document, pas seulement en
// supposant qu'un CSS mobile-first suffit.
const ROUTES = [
  { app: "storefront", url: `${STOREFRONT_URL}/fr` },
  { app: "storefront", url: `${STOREFRONT_URL}/fr/menu` },
  { app: "storefront", url: `${STOREFRONT_URL}/fr/panier` },
  { app: "storefront", url: `${STOREFRONT_URL}/fr/paiement` },
  { app: "storefront", url: `${STOREFRONT_URL}/fr/suivi` },
  { app: "storefront", url: `${STOREFRONT_URL}/en` },
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
