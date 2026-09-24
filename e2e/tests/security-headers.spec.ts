import type { ConsoleMessage } from "@playwright/test";
import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

const APPS = [
  { name: "storefront", baseUrl: STOREFRONT_URL },
  { name: "backoffice", baseUrl: BACKOFFICE_URL },
];
const LOCALES = ["fr", "en"] as const;

/**
 * M1 (audit-1.md) : la CSP à nonce (`src/proxy.ts` des deux apps) ne doit plus bloquer les scripts
 * inline que Next.js génère lui-même — reproduit ici l'erreur constatée par l'audit (« Refused to
 * execute inline script ») en collectant réellement la console du navigateur, pas en la supposant
 * absente.
 */
for (const app of APPS) {
  test.describe(`${app.name} — CSP et en-têtes de sécurité`, () => {
    for (const locale of LOCALES) {
      test(`/${locale} : 0 erreur console/JS, en-têtes de sécurité présents`, async ({ page }) => {
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

        const response = await page.goto(`${app.baseUrl}/${locale}`);
        expect(response?.status()).toBe(200);

        // Laisse le temps à l'hydratation (et à toute erreur asynchrone) de se produire avant de
        // vérifier la console — une page CSP-cassée jette précisément à ce moment-là.
        await page.waitForLoadState("networkidle");

        const headers = response?.headers() ?? {};
        expect(headers["content-security-policy"]).toBeTruthy();
        expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
        expect(headers["content-security-policy"]).toContain("object-src 'none'");
        expect(headers["content-security-policy"]).toContain("base-uri 'self'");
        expect(headers["x-content-type-options"]).toBe("nosniff");
        expect(headers["referrer-policy"]).toBeTruthy();

        const cspErrors = consoleErrors.filter((text) =>
          /content security policy|refused to (execute|load|apply)/i.test(text),
        );
        expect(cspErrors, `Erreurs CSP en console : ${cspErrors.join("\n")}`).toHaveLength(0);
        expect(consoleErrors, `Erreurs console : ${consoleErrors.join("\n")}`).toHaveLength(0);
        expect(pageErrors, `Erreurs JS non interceptées : ${pageErrors.join("\n")}`).toHaveLength(
          0,
        );
      });
    }
  });
}

// Vérifie que le nonce posé par le proxy est bien celui appliqué aux scripts inline générés par
// Next (preuve que la CSP à nonce fonctionne réellement, pas seulement qu'elle ne lève pas d'erreur
// par accident faute de script inline à bloquer). Lu depuis le HTML brut de la réponse : les
// navigateurs masquent volontairement l'attribut `nonce` aux sélecteurs CSS/`getAttribute` une fois
// l'élément inséré dans le DOM (protection contre l'exfiltration du nonce), donc `page.locator(...)`
// ne peut pas servir de preuve ici — le HTML servi par le serveur, si.
test("storefront /fr : le nonce de la CSP correspond au nonce des scripts inline", async ({
  request,
}) => {
  const response = await request.get(`${STOREFRONT_URL}/fr`);
  const csp = response.headers()["content-security-policy"] ?? "";
  const nonceMatch = /'nonce-([^']+)'/.exec(csp);
  expect(nonceMatch).not.toBeNull();
  const nonce = nonceMatch?.[1];

  const html = await response.text();
  const occurrences = html.split(`nonce="${nonce}"`).length - 1;
  expect(occurrences).toBeGreaterThan(0);
});
