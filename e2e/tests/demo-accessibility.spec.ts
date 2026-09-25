import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

// AC-P01-09 : aucune violation axe « serious » ou « critical » sur les 4 écrans de la maquette
// (accueil, menu, panier/créneau — dont paiement simulé et suivi font partie du même écran selon la
// spec §2 —, tableau de service).
const SCREENS = [
  { name: "storefront — accueil", url: `${STOREFRONT_URL}/fr` },
  { name: "storefront — menu", url: `${STOREFRONT_URL}/fr/menu` },
  { name: "storefront — panier et créneau", url: `${STOREFRONT_URL}/fr/panier` },
  { name: "storefront — paiement simulé", url: `${STOREFRONT_URL}/fr/paiement` },
  { name: "storefront — suivi", url: `${STOREFRONT_URL}/fr/suivi` },
  { name: "backoffice — tableau de service", url: `${BACKOFFICE_URL}/fr` },
];

test.use({ viewport: { width: 375, height: 812 } });

for (const screen of SCREENS) {
  test(`${screen.name} : aucune violation axe serious/critical`, async ({ page }) => {
    await page.goto(screen.url);
    // Laisse le temps à l'amorçage du tableau de service (backoffice) et à l'hydratation.
    await page.waitForLoadState("networkidle");

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
  });
}
