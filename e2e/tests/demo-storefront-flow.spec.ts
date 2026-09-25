import type { ConsoleMessage, Request } from "@playwright/test";
import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const STOREFRONT_ORIGIN = new URL(STOREFRONT_URL).origin;

// AC-P01-02 : parcours complet mobile — accueil → Retrait → ajout d'un produit avec option
// obligatoire → panier → créneau → paiement simulé → suivi « Prête » ; aucune erreur console.
// AC-P01-04 (contre-épreuve dans le parcours) : impossible d'ajouter au panier sans la sélection
// obligatoire (cuisson, min=1) — le message d'erreur apparaît, puis l'ajout réussit une fois choisie.
// AC-P01-08 : chaque requête réseau observée pendant le parcours reste same-origin (aucun appel API
// ni domaine tiers) — interception réelle, pas une hypothèse.
test.use({ viewport: { width: 375, height: 812 } });

test("parcours client démo — accueil → menu → panier → paiement simulé → suivi « Prête »", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requests: Request[] = [];

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error: Error) => {
    pageErrors.push(error.message);
  });
  page.on("request", (request: Request) => {
    requests.push(request);
  });

  // 1. Accueil.
  await page.goto(`${STOREFRONT_URL}/fr`);
  await expect(page.getByRole("heading", { name: "Le Belvédère Imaginaire", level: 1 })).toBeVisible();

  // 2. Choix du canal « Retrait » → navigue vers le menu.
  await page.getByRole("button", { name: "Retrait" }).click();
  await expect(page).toHaveURL(`${STOREFRONT_URL}/fr/menu`);

  // 3. Produit avec groupe d'options obligatoire (« Entrecôte », cuisson min=1 max=1) : l'ajout sans
  // sélection affiche l'erreur (AC-P01-04), puis réussit une fois la cuisson choisie.
  const entrecoteCard = page.locator("article", { hasText: "Entrecôte" });
  await entrecoteCard.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(entrecoteCard.getByRole("alert")).toContainText("Sélection incomplète");
  await entrecoteCard.getByLabel("À point", { exact: false }).check();
  await entrecoteCard.getByRole("button", { name: "Ajouter au panier" }).click();

  // 4. Barre de panier fixe → panier.
  await page.getByRole("link", { name: "Voir le panier" }).click();
  await expect(page).toHaveURL(`${STOREFRONT_URL}/fr/panier`);

  // 5. Créneau : décoche « dès que possible », choisit un créneau disponible.
  await page.getByLabel("Dès que possible").uncheck();
  await page.getByRole("radio", { name: /18 h 00/ }).click();

  // 6. Paiement simulé.
  await page.getByRole("button", { name: "Payer" }).click();
  await expect(page).toHaveURL(`${STOREFRONT_URL}/fr/paiement`);
  await expect(page.getByText("Ceci est une démonstration")).toBeVisible();
  await page.getByRole("button", { name: "Confirmer le paiement (démonstration)" }).click();

  // 7. Suivi de commande, avancé manuellement jusqu'à « Prête ».
  await expect(page).toHaveURL(`${STOREFRONT_URL}/fr/suivi`);
  await page.getByRole("button", { name: "Avancer la commande (démonstration)" }).click();
  await page.getByRole("button", { name: "Avancer la commande (démonstration)" }).click();
  await expect(page.getByText("Votre commande de démonstration est prête.")).toBeVisible();

  await page.waitForLoadState("networkidle");

  expect(consoleErrors, `Erreurs console : ${consoleErrors.join("\n")}`).toHaveLength(0);
  expect(pageErrors, `Erreurs JS non interceptées : ${pageErrors.join("\n")}`).toHaveLength(0);

  const foreignRequests = requests
    .map((request) => request.url())
    .filter((url) => !url.startsWith(STOREFRONT_ORIGIN) && !url.startsWith("data:"));
  expect(
    foreignRequests,
    `Requêtes hors origine (API/domaine tiers) interdites (AC-P01-08) : ${foreignRequests.join("\n")}`,
  ).toHaveLength(0);
});
