import type { ConsoleMessage, Request } from "@playwright/test";
import { expect, test } from "@playwright/test";

const BACKOFFICE_URL = "http://127.0.0.1:3101";
const BACKOFFICE_ORIGIN = new URL(BACKOFFICE_URL).origin;

// AC-P01-03 : une commande fictive apparaît (amorçage automatique du tableau de service),
// Accepter → Prête ; Pause affiche l'état en pause.
// AC-P01-08 : aucune requête hors origine pendant le parcours.
test("tableau de service démo — arrivée d'une commande, Accepter → Prête, Pause", async ({
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

  await page.goto(`${BACKOFFICE_URL}/fr`);
  await expect(page.getByRole("heading", { name: "Tableau de service", level: 1 })).toBeVisible();

  // Amorçage automatique : une commande fictive apparaît sans action de l'utilisateur.
  const orderCard = page.getByRole("article").first();
  await expect(orderCard).toBeVisible({ timeout: 10_000 });
  await expect(orderCard).toContainText("Nouvelle");

  // Accepter → passe en préparation.
  await orderCard.getByRole("button", { name: "Accepter" }).click();
  await expect(orderCard).toContainText("En préparation");

  // Prête.
  await orderCard.getByRole("button", { name: "Prête" }).click();
  await expect(orderCard).toContainText("Prête");
  await expect(orderCard.getByRole("button", { name: "Accepter" })).toHaveCount(0);
  await expect(orderCard.getByRole("button", { name: "Refuser" })).toHaveCount(0);

  // Pause des commandes.
  await page.getByRole("button", { name: "Pause des commandes" }).click();
  await expect(page.getByRole("status")).toContainText("en pause");
  await expect(page.getByRole("button", { name: "Reprendre les commandes" })).toBeVisible();

  await page.waitForLoadState("networkidle");

  expect(consoleErrors, `Erreurs console : ${consoleErrors.join("\n")}`).toHaveLength(0);
  expect(pageErrors, `Erreurs JS non interceptées : ${pageErrors.join("\n")}`).toHaveLength(0);

  const foreignRequests = requests
    .map((request) => request.url())
    .filter((url) => !url.startsWith(BACKOFFICE_ORIGIN) && !url.startsWith("data:"));
  expect(
    foreignRequests,
    `Requêtes hors origine (API/domaine tiers) interdites (AC-P01-08) : ${foreignRequests.join("\n")}`,
  ).toHaveLength(0);
});
