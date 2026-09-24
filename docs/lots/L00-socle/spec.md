# Lot L00 — Socle technique du monorepo

- **Statut** : PROPOSÉ
- **Validé par / le** : _à compléter par le porteur_          ← requis avant toute implémentation
- **Critique** : non (aucune logique métier, aucune donnée, aucun paiement) — audit `auditor-opus` quand même
- **ADR liés** : 0001, 0002, 0003 (préparation seulement), 0007 (préparation), 0010, 0013
- **Branche** : `lot/L00-socle` (créée depuis `claude/opus-sonnet-workflow-gxnvua` tant que `main` ne contient pas le cadrage)

## 1. Besoin et contexte

Créer la fondation technique sur laquelle tous les lots suivants s'appuient : monorepo, outillage de
qualité, environnement local reproductible, CI, squelettes des trois applications. **Aucune fonctionnalité
métier, aucune table métier, aucune dépendance à un fournisseur externe réel.**

## 2. Périmètre

### Inclus
- Monorepo pnpm workspaces + Turborepo ; TypeScript strict partagé ; ESLint + Prettier partagés.
- Squelettes :
  - `apps/api` : NestJS + Fastify, routes `GET /health/live` et `GET /health/ready`, entrée `worker.ts`
    qui démarre et s'arrête proprement (boucle vide, aucune tâche).
  - `apps/storefront` : Next.js App Router, une page d'accueil statique FR/EN (« Bientôt disponible »).
  - `apps/backoffice` : Next.js App Router, une page statique « Back-office » FR/EN.
- Packages vides mais configurés (build, lint, test) : `domain`, `contracts`, `db`, `ui`, `i18n`, `config`, `testing`.
- `packages/domain` : un seul module exemple **`money`** (type `Money`, addition, refus des devises
  différentes) avec tests unitaires — sert à valider la chaîne de test, conforme à l'ADR 0014.
- Validation de la configuration au démarrage (schéma Zod des variables d'environnement) + `.env.example`.
- Logger JSON structuré avec `correlationId` (en-tête `x-correlation-id` accepté ou généré, renvoyé).
- `infra/docker/compose.yaml` : PostgreSQL, Redis, Mailpit, MinIO (images épinglées) pour le développement.
- Dockerfile multi-stage non-root pour `api` (sert aussi au worker).
- Vitest (unitaires) et Playwright (un e2e : les pages storefront et backoffice répondent 200 et affichent
  le texte FR et EN).
- Règle ESLint de frontières : une app n'importe pas une autre app ; un paquet n'importe pas une app ;
  `packages/domain` n'importe aucun framework (NestJS, Next, Drizzle, Stripe, ioredis…).
- CI GitHub Actions (`.github/workflows/ci.yml`) sur PR et push : install verrouillée → format → lint →
  typecheck → tests unitaires → tests des hooks `.claude/hooks/test-guards.sh` → gitleaks → audit des
  dépendances (rapport, non bloquant au L00 sauf critique) → build → e2e. **Aucun déploiement.**
- Scripts racine : `format`, `format:check`, `lint`, `typecheck`, `test`, `test:e2e`, `build`, `dev`.
  `test:int` et `test:tenancy` existent mais sont documentés comme introduits au L01.
- `README.md` racine : prérequis, démarrage local, commandes.

### Exclu
Base de données applicative (schéma, migrations, RLS → L01) · authentification (L02) · Redis utilisé par
le code (L01+) · OpenAPI (dès la première route métier) · OpenTelemetry complet (L13) · déploiement,
Terraform/OpenTofu, image scannée/SBOM (L13) · i18n complet (L05).

## 3. User stories
- **US-L00-1** En tant que développeur, je clone le dépôt et lance tout l'environnement en ≤ 3 commandes.
- **US-L00-2** En tant que porteur, je vois la CI rejeter automatiquement une PR qui casse le lint, le
  typage, un test ou qui contient un secret.

## 4. Critères d'acceptation

- **AC-L00-01** `pnpm install --frozen-lockfile` réussit sur une copie propre du dépôt.
- **AC-L00-02** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` réussissent
  à la racine (sortie citée dans le rapport).
- **AC-L00-03** `docker compose -f infra/docker/compose.yaml up -d` démarre PG, Redis, Mailpit, MinIO avec
  des healthchecks verts ; aucun mot de passe réel commité (valeurs de développement explicitement factices).
- **AC-L00-04** `GET /health/live` → 200 `{ "status": "ok" }` ; `GET /health/ready` → 200 si la config est
  valide (au L00, pas encore de vérification DB/Redis ; le contrat de réponse prévoit ces sections).
- **AC-L00-05** L'API refuse de démarrer avec une variable d'environnement requise manquante ou invalide,
  avec un message clair **sans afficher la valeur**.
- **AC-L00-06** Toute réponse API porte `x-correlation-id` ; un id fourni est réutilisé ; les logs sont en
  JSON et contiennent ce `correlationId`.
- **AC-L00-07** `packages/domain/money` : `add(CHF 10.00, CHF 2.50) = CHF 12.50` (1250 centimes) ;
  `add(CHF, EUR)` lève une erreur ; montants non entiers refusés. Tests unitaires passants.
- **AC-L00-08** Un import de `@nestjs/*` dans `packages/domain`, ou d'une app dans une autre, fait échouer
  `pnpm lint` (prouvé par un test ou une démonstration citée dans le rapport, puis retirée).
- **AC-L00-09** Les pages storefront et backoffice répondent 200 en FR (`/fr`) et EN (`/en`) ; e2e passant.
- **AC-L00-10** La CI exécute toutes les étapes listées, et un secret factice de test ajouté dans une
  branche jetable est détecté par gitleaks (démonstration décrite, non commitée).
- **AC-L00-11** L'image `api` se construit, tourne en utilisateur non-root, et `/health/live` répond depuis
  le conteneur.
- **AC-L00-12** `.claude/hooks/test-guards.sh` passe en CI.
- **AC-L00-13** `bonjour.html` à la racine est conservé tel quel.

## 5. Contrat API
Uniquement `/health/live` et `/health/ready` (voir AC-L00-04). Format d'erreur standard
(`docs/architecture/api-contracts.md`) implémenté par un filtre global, testé sur une route 404.

## 6. Modèle de données
Aucun. Compose fournit PostgreSQL vide.

## 7. Sécurité
- `.gitignore` couvre `.env*` (sauf `.env.example`), clés, artefacts de build.
- En-têtes de sécurité de base sur l'API (Helmet Fastify ou équivalent) et les deux apps Next.
- Images Docker épinglées par version ; utilisateur non-root.
- Aucune nouvelle dépendance hors de celles nécessaires à ce socle ; la liste complète figure dans le
  rapport (**validation humaine des dépendances de production** : elle vaut pour la liste ci-dessous).

## 8. Versions et dépendances (à vérifier au démarrage du lot)
Relevé npm du 2026-09-24 : Next 16.3.6 · React 19.3.0 · NestJS 12.1.0 · @nestjs/platform-fastify 12.1.0 ·
Fastify 5.12.5 · TypeScript 7.0.2 · pnpm 12.6.0 · turbo 2.11.3 · Zod 4.6.5 · Vitest 5.0.1 · Playwright 1.63.0.
- **Node** : dernière version LTS active (vérifier sur nodejs.org), fixée dans `.nvmrc` et `engines`.
- **TypeScript 7** : vérifier la compatibilité des décorateurs/métadonnées NestJS et de l'outillage
  (ESLint, Vitest, Next). En cas d'incompatibilité, utiliser la dernière version antérieure compatible et
  le consigner dans le rapport — **ne pas contourner** par des options de compilation non strictes.
- Toutes les versions épinglées exactement dans les `package.json` ; lockfile commité.

## 9. Plan de test
- Unitaires : `money` (AC-L00-07) ; filtre d'erreur ; middleware `correlationId` ; schéma de config.
- Intégration légère : démarrage de l'API avec Fastify injecté (`/health/*`, en-tête de corrélation, 404 standard).
- E2E : AC-L00-09.
- CI : AC-L00-10, AC-L00-12.

## 10. Observabilité
Logger JSON (pino via Fastify) : niveau, horodatage, `correlationId`, route, statut, durée ; liste
d'autorisation de champs (pas d'en-têtes bruts, pas de corps).

## 11. Risques et questions ouvertes
- Compatibilité TypeScript 7 / NestJS (voir § 8).
- Temps de CI : cache pnpm et Turborepo activés.
- La protection de `main` doit être configurée par le porteur avant la première fusion.

## 12. Fichiers attendus (indicatif)
`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.gitignore`, `.editorconfig`,
`README.md`, `.env.example`, `apps/{api,storefront,backoffice}/**`, `packages/*/**`, `e2e/**`,
`infra/docker/{compose.yaml,api.Dockerfile}`, `.github/workflows/ci.yml`,
`docs/lots/L00-socle/implementation-report.md`.

## 13. Temps (heures du porteur)
| Cadrage | Validation/revue | Tests manuels | Total |
|---|---|---|---|
| | | | |
