# SaaS de commande directe pour restaurants — monorepo

> Lot **L00 — socle technique**. Aucune fonctionnalité métier à ce stade. Voir `CLAUDE.md` et
> `docs/lots/L00-socle/spec.md`.

## Prérequis

- Node.js **24.21.0** (LTS active « Krypton » au 2026-09-24 — voir `.nvmrc`). Si vous utilisez
  [nvm](https://github.com/nvm-sh/nvm) : `nvm install && nvm use`.
- pnpm **12.6.0** (via [corepack](https://nodejs.org/api/corepack.html) : `corepack enable && corepack prepare pnpm@12.6.0 --activate`).
- Docker + Docker Compose (pour PostgreSQL, Redis, Mailpit, MinIO en local — non utilisés par le
  code au lot L00, préparés pour le lot L01).

## Démarrage local (≤ 3 commandes)

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

## Commandes

```bash
pnpm install --frozen-lockfile   # installation verrouillée
pnpm format:check                # Prettier (vérification)
pnpm lint                        # ESLint (inclut les règles de frontières de modules)
pnpm typecheck                   # TypeScript strict, tous les paquets/apps
pnpm test                        # tests unitaires (Vitest)
pnpm test:e2e                    # tests end-to-end (Playwright)
pnpm build                       # build de production de toutes les apps/paquets
pnpm dev                         # démarre apps/api, apps/storefront, apps/backoffice en watch

docker compose -f infra/docker/compose.yaml up -d   # PostgreSQL, Redis, Mailpit, MinIO
```

`pnpm test:int` et `pnpm test:tenancy` seront introduits au lot L01 (base de données applicative).

## Structure

```
apps/api          NestJS + Fastify — /health/live, /health/ready, worker (boucle vide au L00)
apps/storefront   Next.js App Router — page « Bientôt disponible » FR/EN
apps/backoffice   Next.js App Router — page « Back-office » FR/EN
packages/domain   logique métier pure (module `money` au L00 — ADR 0014)
packages/contracts, db, ui, i18n, config, testing   paquets vides mais configurés (L01+)
infra/docker      compose.yaml (dev) + Dockerfile multi-stage non-root pour l'API
e2e               tests Playwright (storefront + backoffice)
```

## Variables d'environnement

Voir `.env.example` (valeurs de développement explicitement factices, aucun secret réel) et
`apps/api/src/config/env.schema.ts` (schéma Zod validé au démarrage de l'API et du worker).

## Documentation

- Vision et périmètre : `docs/product/`
- Décisions d'architecture (ADR) : `docs/decisions/`
- Processus (workflow Opus/Sonnet, gates, definition of done) : `docs/process/`
- Spécification et rapport d'implémentation du lot en cours : `docs/lots/<lot>/`
