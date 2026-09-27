import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";

// M2 (audit-1.md, spec P01 §2.3 « frais et minimum affichés ») : frais de livraison fictifs et
// minimum de commande, canal livraison uniquement, inclus dans le total affiché, bouton Payer
// bloqué si le minimum n'est pas atteint.
// L10 (audit-1.md) : lignes modifiables par +/- de quantité ; « Payer » exige aussi un créneau (ou
// « dès que possible ») et un panier non vide ; `/paiement` avec un panier vide affiche un message.
test.use({ viewport: { width: 375, height: 812 } });

test("livraison : frais affichés, minimum non atteint bloque Payer, atteint le débloque", async ({
  page,
}) => {
  await page.goto(`${STOREFRONT_URL}/fr`);
  await page.getByRole("button", { name: "Livraison" }).click();

  const soupCard = page.locator("article", { hasText: "Salade de saison" });
  await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.getByRole("link", { name: "Voir le panier" }).click();

  // Sous-total 9.00 CHF < minimum 20.00 CHF : message affiché, frais toujours affichés, Payer bloqué.
  await expect(page.getByText("Frais de livraison : 3.50 CHF")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Minimum de commande" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "11.00 CHF" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Payer" })).toBeDisabled();

  // Ajoute l'entrecôte (34.00 CHF) : sous-total 43.00 CHF >= minimum, l'avertissement disparaît et
  // le total inclut les frais (43.00 + 3.50 = 46.50 CHF). Pas de lien retour vers le menu depuis le
  // panier dans cette maquette (spec P01 §2) : navigation directe par l'URL.
  await page.goto(`${STOREFRONT_URL}/fr/menu`);
  const steakCard = page.locator("article", { hasText: "Entrecôte" });
  await steakCard.getByLabel("À point", { exact: false }).check();
  await steakCard.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.getByRole("link", { name: "Voir le panier" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Minimum de commande" })).toHaveCount(0);
  await expect(page.getByText("Total : 46.50 CHF")).toBeVisible();
  await expect(page.getByRole("button", { name: "Payer" })).toBeEnabled();

  await page.getByRole("button", { name: "Payer" }).click();
  await expect(page).toHaveURL(`${STOREFRONT_URL}/fr/paiement`);
  await expect(page.getByText("Montant (démonstration) : 46.50 CHF")).toBeVisible();
});

test("retrait : jamais de frais ni de minimum, quel que soit le sous-total", async ({ page }) => {
  await page.goto(`${STOREFRONT_URL}/fr`);
  await page.getByRole("button", { name: "Retrait" }).click();
  const soupCard = page.locator("article", { hasText: "Salade de saison" });
  await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.getByRole("link", { name: "Voir le panier" }).click();

  await expect(page.getByText("Frais de livraison")).toHaveCount(0);
  await expect(page.getByRole("alert").filter({ hasText: "Minimum de commande" })).toHaveCount(0);
  await expect(page.getByText("Total : 9.00 CHF")).toBeVisible();
  await expect(page.getByRole("button", { name: "Payer" })).toBeEnabled();
});

test("lignes modifiables : +/- de quantité met à jour le total, 0 retire la ligne", async ({
  page,
}) => {
  await page.goto(`${STOREFRONT_URL}/fr`);
  await page.getByRole("button", { name: "Retrait" }).click();
  const soupCard = page.locator("article", { hasText: "Salade de saison" });
  await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.getByRole("link", { name: "Voir le panier" }).click();

  await expect(page.getByText("Total : 9.00 CHF")).toBeVisible();
  await page.getByRole("button", { name: "Augmenter la quantité" }).click();
  await expect(page.getByText("Total : 18.00 CHF")).toBeVisible();
  await page.getByRole("button", { name: "Diminuer la quantité" }).click();
  await page.getByRole("button", { name: "Diminuer la quantité" }).click();
  await expect(page.getByText("Votre panier de démonstration est vide.")).toBeVisible();
});

test("Payer exige un créneau (ou « dès que possible ») en plus d'un panier non vide", async ({
  page,
}) => {
  await page.goto(`${STOREFRONT_URL}/fr`);
  await page.getByRole("button", { name: "Retrait" }).click();
  const soupCard = page.locator("article", { hasText: "Salade de saison" });
  await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.getByRole("link", { name: "Voir le panier" }).click();

  // « Dès que possible » est cochée par défaut : Payer est déjà activé.
  await expect(page.getByRole("button", { name: "Payer" })).toBeEnabled();

  // Décoche sans choisir de créneau : Payer se bloque, un message l'explique.
  await page.getByLabel("Dès que possible").uncheck();
  await expect(page.getByRole("button", { name: "Payer" })).toBeDisabled();
  await expect(page.getByRole("alert").filter({ hasText: "Choisissez un créneau" })).toBeVisible();

  await page.getByRole("radio", { name: /18 h 00/ }).click();
  await expect(page.getByRole("button", { name: "Payer" })).toBeEnabled();
});

test("/paiement avec un panier vide affiche un message plutôt qu'un montant à payer", async ({
  page,
}) => {
  await page.goto(`${STOREFRONT_URL}/fr/paiement`);
  await expect(
    page.getByText("Votre panier de démonstration est vide : rien à payer."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmer le paiement" })).toHaveCount(0);
  await page.getByRole("link", { name: "Retour au menu" }).click();
  await expect(page).toHaveURL(`${STOREFRONT_URL}/fr/menu`);
});

test("les coordonnées invitées et le panier sont purgés après le paiement simulé", async ({
  page,
}) => {
  await page.goto(`${STOREFRONT_URL}/fr`);
  await page.getByRole("button", { name: "Retrait" }).click();
  const soupCard = page.locator("article", { hasText: "Salade de saison" });
  await soupCard.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.getByRole("link", { name: "Voir le panier" }).click();
  await page.getByLabel("Nom").fill("Jean Fictif");
  await page.getByLabel("Téléphone").fill("+41 00 000 00 00");

  await page.getByRole("button", { name: "Payer" }).click();
  await page.getByRole("button", { name: "Confirmer le paiement (démonstration)" }).click();
  await expect(page).toHaveURL(`${STOREFRONT_URL}/fr/suivi`);

  const stored = await page.evaluate(() => window.localStorage.getItem("demo-storefront-state-v1"));
  const state = JSON.parse(stored ?? "{}") as {
    lines: unknown[];
    guest: { name: string; phone: string };
  };
  expect(state.lines).toEqual([]);
  expect(state.guest).toEqual({ name: "", phone: "", note: "" });
});
