import { connection } from "next/server";
import type { ReactNode } from "react";

// M1 (audit-2.md) : ce fichier racine (hors `[locale]`) remplace le contenu 404 par défaut de Next
// (`next/dist/client/components/builtin/not-found.js` → `HTTPAccessErrorFallback`), qui pose un
// `<style>` et des attributs `style` en ligne sans notre nonce CSP (constaté par
// `e2e/tests/not-found.spec.ts` : « Refused to apply inline style »). Il est utilisé quand
// `notFound()` est levé à l'intérieur du segment `[locale]` (ex. `/xx`, locale non supportée, voir
// `[locale]/page.tsx`) : le layout `[locale]/layout.tsx` n'a pas de `not-found.tsx` propre, donc
// l'erreur remonte à la limite racine — qui n'a pas non plus de `app/layout.tsx` (le modèle i18n
// utilisé place `<html>`/`<body>` dans `[locale]/layout.tsx`, cf. commentaire de ce fichier) : ce
// composant doit donc fournir son propre document complet, comme `app/global-not-found.tsx`.
export default async function NotFound(): Promise<ReactNode> {
  // Rendu dynamique obligatoire pour que le nonce CSP (`src/proxy.ts`) soit injecté (voir
  // `docs/architecture/rendering-and-csp.md`).
  await connection();

  return (
    <html lang="fr">
      <body>
        <main>
          <p lang="fr">Page introuvable.</p>
          <p lang="en">Page not found.</p>
        </main>
      </body>
    </html>
  );
}
