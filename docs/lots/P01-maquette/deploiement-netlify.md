# Déploiement Netlify de la maquette P01 (décision D-P01-1)

- **Décision du porteur (2026-09-24)** : Netlify, hors Suisse acceptable pour cette maquette (aucune
  donnée réelle ni personnelle — spec `docs/lots/P01-maquette/spec.md` §8).
- **Ce que l'agent a préparé** : `apps/storefront/netlify.toml`, `apps/backoffice/netlify.toml`, ce
  document. **Ce que l'agent n'a pas fait** : créer de compte Netlify, connecter le dépôt, déployer —
  actions humaines (règle n°11 du `CLAUDE.md` : aucun déploiement production par un agent ; ici, même
  une démonstration hors production reste une action de compte/domaine réservée au porteur).

## Points non vérifiés — à confirmer par le porteur avant de connecter le dépôt

Le fil principal (Opus) n'a **pas pu consulter** `docs.netlify.com` ni `netlify.com` : le proxy réseau
de l'environnement de développement bloque ces domaines. Les points suivants sont donc des
**hypothèses, pas des faits vérifiés** — à contrôler dans la documentation officielle avant toute
connexion réelle du dépôt :

1. **Prise en charge de Next.js 16 (App Router) et de `proxy.ts` par le runtime Netlify.** Cette
   maquette dépend d'un rendu **dynamique par requête** (`await connection()` dans chaque
   `[locale]/layout.tsx`) pour injecter un nonce CSP différent à chaque requête
   (`apps/*/src/proxy.ts`, voir `docs/architecture/rendering-and-csp.md`). La convention `proxy.ts`
   remplace `middleware.ts` depuis Next 16 (commentaire de tête de `src/proxy.ts`) : vérifier que le
   module de build Next.js de Netlify (`@netlify/plugin-nextjs`, référencé dans les `netlify.toml`
   ci-joints) reconnaît cette convention récente et exécute effectivement ce code à chaque requête
   (pas seulement au build). Si ce n'est pas le cas, la CSP à nonce (et donc les pages elles-mêmes)
   pourrait ne pas fonctionner en production Netlify alors qu'elle fonctionne dans cet environnement
   de développement (`next start`, vérifié — voir le rapport d'implémentation).
2. **Conditions de l'offre gratuite pour un usage de démonstration commerciale** (démarchage de
   restaurants). Vérifier les conditions d'utilisation actuelles de l'offre gratuite Netlify
   (limites de bande passante/minutes de build, usage commercial autorisé ou non) avant de s'y fier
   pour des rendez-vous réels.
3. **Disponibilité de la protection par mot de passe selon l'offre.** La spec recommande de protéger
   l'accès (mot de passe ou lien non indexé). Vérifier si la protection par mot de passe Netlify est
   incluse dans l'offre retenue ; à défaut, ne compter que sur les mesures ci-dessous (en-tête
   `X-Robots-Tag`, URL non communiquée publiquement).
4. **(L7, audit-1.md) Prise en charge de `pnpm@12.6.0` via Corepack.** Le `package.json` racine
   déclare `"packageManager": "pnpm@12.6.0"` ; Netlify active généralement Corepack à partir de ce
   champ pour installer la version exacte déclarée, mais cette prise en charge (et celle de Corepack
   lui-même) par l'image de build Netlify n'a pas pu être confirmée dans la documentation officielle.
5. **(L7, audit-1.md) Version Node exacte.** Le `package.json` racine déclare `"engines": { "node":
   ">=24.21.0" }` ; `NODE_VERSION = "24"` dans les `netlify.toml` ne fixe qu'une branche majeure, pas
   la version mineure/patch minimale exacte — à confirmer que l'image Netlify pour Node 24 satisfait
   bien `>=24.21.0` au moment du déploiement.
6. **(N6, audit-2.md) Portée réelle du bloc `[[headers]]` des `netlify.toml`.** HYPOTHÈSE, non
   vérifiée ici (accès à `docs.netlify.com` bloqué) : ce bloc s'appliquerait à toute réponse Netlify
   quelle que soit son origine (fonction Next.js ou CDN statique), pas seulement aux réponses rendues
   par la fonction Next.js. Voir la vérification `curl -I` du point « Ce qui reste à vérifier après le
   premier déploiement » ci-dessous.
7. **(I3, audit-2.md) Deploy previews / branch deploys publics et barre d'outils Netlify.**
   HYPOTHÈSE, non vérifiée ici : selon la configuration du compte/site, Netlify peut publier des
   URL de prévisualisation (deploy previews sur pull request, branch deploys) accessibles publiquement
   sans authentification, en plus du domaine de production `*.netlify.app` — à vérifier et, si
   souhaité, désactiver ou protéger dans les réglages du site avant de démarcher un restaurant avec
   une URL de prévisualisation. Netlify peut aussi injecter une barre d'outils (« Netlify badge »/
   « deploy preview toolbar ») via un script tiers sur certains types de déploiement : la CSP à nonce
   de ce lot (`src/proxy.ts`, `docs/architecture/rendering-and-csp.md`) ne l'autorise pas explicitement
   et le bloquerait probablement (« aucun script tiers hors Stripe » côté paiement n'est pas concerné
   ici, mais la CSP reste restrictive par défaut) — à observer à l'écran, sans supposer que la
   fonctionnalité (si activée par le porteur) fonctionnera telle quelle.

Aucune de ces hypothèses n'a été activée ou présumée vraie dans le code : les `netlify.toml` sont une
proposition de configuration, pas une confirmation qu'elle fonctionnera telle quelle.

## Ce qui est vérifié (par ce lot, dans cet environnement de développement)

- `pnpm build` (direct, hors Turborepo — voir « Écart environnement » du rapport d'implémentation)
  produit un dossier `.next` pour chaque app avec des routes dynamiques (`ƒ`), cohérent avec ce que
  Netlify doit reconstruire.
- Toutes les routes des deux apps posent l'en-tête `X-Robots-Tag: noindex, nofollow` (ajouté dans
  `next.config.ts` des deux apps, ce lot), en plus des en-têtes de sécurité déjà posés au lot L00 et de
  la CSP à nonce (`src/proxy.ts`) — vérifié par `e2e/tests/security-headers.spec.ts` (rejoué avec
  `next start`, serveur de production local).

## Procédure indicative (deux sites Netlify, un par app — ADR 0010)

Ces étapes sont à exécuter par le porteur (compte, connexion du dépôt) ; l'agent ne les exécute pas.

1. Créer un compte/organisation Netlify (offre à choisir après vérification du point 2 ci-dessus).
2. **Site 1 — storefront** : « Add new site » → « Import an existing project » → dépôt Git du projet.
   - Répertoire de base (« Base directory ») : `apps/storefront`. Netlify doit alors détecter
     `apps/storefront/netlify.toml` (comportement monorepo — HYPOTHÈSE, point 1 ci-dessus, à
     confirmer à l'écran de configuration avant de déployer).
   - Si la détection automatique du `netlify.toml` du sous-répertoire ne fonctionne pas telle
     qu'espérée, configurer manuellement dans l'interface Netlify : commande de build et répertoire de
     publication identiques à ceux du fichier `apps/storefront/netlify.toml` (commentés en français).
3. **Site 2 — backoffice** : répéter l'étape 2 avec `apps/backoffice` comme répertoire de base et
   `apps/backoffice/netlify.toml`. Le back-office ne doit **jamais** être exposé sur le même domaine
   que le storefront (ADR 0010) : deux sites Netlify distincts, deux sous-domaines `*.netlify.app`
   distincts par défaut.
4. Activer, si disponible dans l'offre retenue (point 3 ci-dessus), la protection par mot de passe sur
   les deux sites. Sinon, ne partager les deux URL qu'en privé (jamais publiées) ; l'en-tête
   `X-Robots-Tag: noindex, nofollow` (déjà en place) limite l'indexation mais ne remplace pas un
   contrôle d'accès.
5. Vérifier après le premier déploiement, sur téléphone réel : les 4 écrans (spec §2), le bandeau de
   démonstration sur chaque page, l'absence d'erreur console, et que la CSP à nonce ne bloque rien
   (ouvrir la console développeur mobile si possible, ou tester au préalable depuis un ordinateur avec
   les outils de développement). **(N6, audit-2.md) Vérifier aussi, depuis un poste avec `curl`**,
   que le bloc `[[headers]]` (point 6 ci-dessus) s'applique bien comme attendu, sur une page rendue
   par la fonction Next.js **et** sur un asset statique servi directement par le CDN :
   ```
   curl -I https://<site>.netlify.app/fr
   curl -I https://<site>.netlify.app/_next/static/<chemin réel d'un asset>
   ```
   et confirmer la présence de `x-robots-tag: noindex, nofollow` dans les deux réponses (pas
   seulement la première) avant de considérer ce point vérifié.
6. En cas d'échec lié au point 1 (rendu dynamique/`proxy.ts` non pris en charge tel quel), ne pas
   forcer une configuration non documentée : revenir à l'option 1 de la spec (`pnpm dev` en réseau
   local) en attendant une vérification plus poussée, ou solliciter à nouveau un agent avec accès à la
   documentation officielle.

## Alternative si Netlify ne convient pas

Spec §8, options 1 (réseau local, `pnpm dev`) et 3 (hébergeur suisse retenu à l'ADR 0012, pas encore
tranché) restent disponibles sans reconfiguration du code applicatif.
