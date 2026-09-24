import type { ConsoleMessage } from "@playwright/test";
import { expect, test } from "@playwright/test";

const STOREFRONT_URL = "http://127.0.0.1:3100";
const BACKOFFICE_URL = "http://127.0.0.1:3101";

const APPS = [
  { name: "storefront", baseUrl: STOREFRONT_URL },
  { name: "backoffice", baseUrl: BACKOFFICE_URL },
];

// M1 (audit-2.md, partiel) : `/_not-found` (route générée par Next pour tout segment qui ne
// correspond à aucune page — ex. `/fr/inexistant`) était prérendue au build, sans nonce CSP
// disponible, provoquant des erreurs « Refused to execute inline script » en console (14 occurrences
// relevées par l'audit sur les pages 404). Corrigé par `app/global-not-found.tsx` (rendu
// dynamique, `experimental.globalNotFound`, voir `next.config.ts` des deux apps et
// `docs/architecture/rendering-and-csp.md`). `/xx` (segment `[locale]` invalide, `notFound()` levé
// depuis un routeur déjà dynamique) est ajouté en contre-épreuve : il fonctionnait déjà correctement
// avant ce correctif (le nonce y est déjà injecté par `[locale]/layout.tsx`), et doit continuer de
// fonctionner après.
const NOT_FOUND_PATHS = ["/fr/inexistant", "/xx"] as const;

for (const app of APPS) {
  test.describe(`${app.name} — pages 404`, () => {
    for (const path of NOT_FOUND_PATHS) {
      test(`${path} : statut 404, 0 erreur console/CSP`, async ({ page }) => {
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

        const response = await page.goto(`${app.baseUrl}${path}`);
        expect(response?.status()).toBe(404);

        await page.waitForLoadState("networkidle");

        const headers = response?.headers() ?? {};
        expect(headers["content-security-policy"]).toBeTruthy();

        // Preuve que le nonce de l'en-tête est bien celui appliqué aux scripts inline de la page
        // servie (pas seulement qu'un en-tête CSP existe) — même méthode que
        // `security-headers.spec.ts` (l'attribut `nonce` est masqué côté DOM par le navigateur une
        // fois l'élément inséré, donc lu depuis le HTML brut de la réponse).
        const csp = headers["content-security-policy"] ?? "";
        const nonceMatch = /'nonce-([^']+)'/.exec(csp);
        expect(nonceMatch).not.toBeNull();
        const html = await response!.text();
        const occurrences = html.split(`nonce="${nonceMatch?.[1]}"`).length - 1;
        expect(occurrences).toBeGreaterThan(0);

        const cspErrors = consoleErrors.filter((text) =>
          /content security policy|refused to (execute|load|apply)/i.test(text),
        );
        expect(cspErrors, `Erreurs CSP en console : ${cspErrors.join("\n")}`).toHaveLength(0);

        // Chromium journalise systématiquement en erreur console l'échec de chargement du document
        // principal lui-même quand son statut HTTP est >= 400 (« Failed to load resource: the
        // server responded with a status of 404 (Not Found) ») — attendu et inhérent à toute page
        // 404 testée via `page.goto`, indépendant de tout bug applicatif ; exclu explicitement pour
        // ne pas masquer d'autres erreurs (toute autre entrée fait toujours échouer l'assertion).
        const unexpectedConsoleErrors = consoleErrors.filter(
          (text) => !/failed to load resource.*404/i.test(text),
        );
        expect(
          unexpectedConsoleErrors,
          `Erreurs console inattendues : ${unexpectedConsoleErrors.join("\n")}`,
        ).toHaveLength(0);
        expect(pageErrors, `Erreurs JS non interceptées : ${pageErrors.join("\n")}`).toHaveLength(
          0,
        );
      });
    }
  });
}
