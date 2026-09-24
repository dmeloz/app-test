# Vue d'ensemble du système

> Statut : PROPOSÉ (ADR 0001, 0002, 0007, 0010). Versions relevées sur le registre npm le 2026-09-24,
> à re-vérifier au lot L00 : Next.js 16.3.6 · React 19.3.0 · NestJS 12.1.0 · Fastify 5.12.5 ·
> TypeScript 7.0.2 · pnpm 12.6.0 · Turborepo 2.11.3 · Drizzle ORM 0.45.3 · Zod 4.6.5 · Stripe (Node) 22.6.2 ·
> Vitest 5.0.1 · Playwright 1.63.0 · Node.js local 22.22.2 (choisir la LTS active au L00).

## Diagramme logique

```text
                 Client final (PWA mobile)                    Personnel (tablette / mobile)
                          │ HTTPS (domaine du restaurant)               │ HTTPS (app.<plateforme>)
                          ▼                                             ▼
                ┌───────────────────┐                        ┌───────────────────┐
  CDN / WAF ──▶ │ apps/storefront    │                        │ apps/backoffice    │
                │ Next.js SSR + PWA  │                        │ Next.js            │
                └─────────┬─────────┘                        └─────────┬─────────┘
                          │ REST /v1 (public)                          │ REST /v1/admin (session OIDC)
                          ▼                                             ▼
                ┌─────────────────────────────────────────────────────────────────┐
                │ apps/api — NestJS + Fastify (monolithe modulaire)                │
                │  tenant · restaurant · location · branding · catalog · menu     │
                │  availability · capacity · cart · pricing · promotion · checkout│
                │  order · payment · refund · delivery · customer · consent       │
                │  notification · integration · reporting · audit · support       │
                │  identity · platform · subscription                             │
                │         ▲ ports                                                  │
                │         │ adaptateurs : Stripe · e-mail · SMS · géocodage ·     │
                │         │ stockage S3 · imprimante · caisse · livraison · OIDC  │
                └───┬───────────────┬──────────────────┬──────────────────────────┘
                    │ SQL (RLS)     │ cache/ratelimit  │ S3
                    ▼               ▼                  ▼
             ┌────────────┐   ┌──────────┐      ┌──────────────┐
             │ PostgreSQL │   │  Redis   │      │ Stockage objet│
             │ + outbox   │   └──────────┘      └──────────────┘
             └─────┬──────┘
                   │ outbox (LISTEN/NOTIFY + polling)
                   ▼
          ┌──────────────────────┐        Webhooks entrants
          │ apps/api (worker)     │◀────── Stripe, e-mail, intégrations
          │ e-mails, impressions, │        (POST /v1/webhooks/* → webhook_event → traitement)
          │ rapprochement, expiration│
          │ des réservations       │──────▶ Stripe API, fournisseur e-mail, …
          └──────────────────────┘
                   │
             OpenTelemetry → traces, métriques, logs JSON → backend d'observabilité
```

## Découpage du monorepo

```text
/
├─ apps/
│  ├─ storefront/          Next.js App Router : site public multi-tenant, PWA, i18n FR/EN
│  ├─ backoffice/          Next.js App Router : back-office restaurant + console opérateur
│  └─ api/                 NestJS + Fastify
│     ├─ src/main.ts          entrée HTTP
│     ├─ src/worker.ts        entrée worker (même code, autre processus)
│     └─ src/modules/<module>/{index.ts, *.controller.ts, *.service.ts, *.repository.ts, ports/, adapters/}
├─ packages/
│  ├─ domain/              logique pure : money, tax, pricing, promotion, capacity, order-state, zones
│  ├─ contracts/           schémas Zod des requêtes/réponses, génération OpenAPI, types partagés
│  ├─ db/                  schéma Drizzle, migrations SQL, politiques RLS, rôles, seeds synthétiques
│  ├─ ui/                  design system React, tokens de thème, vérification de contraste
│  ├─ i18n/                catalogues FR/EN partagés, formatage Intl
│  ├─ config/              tsconfig, eslint, prettier partagés
│  └─ testing/             fabriques synthétiques, harnais d'isolation tenant, horloge factice
├─ e2e/                    Playwright
├─ infra/
│  ├─ docker/              Dockerfiles, compose.yaml (dev : PG, Redis, Mailpit, MinIO, stripe-mock/CLI)
│  └─ tofu/                OpenTofu par environnement (staging, production)
├─ docs/                   cadrage, ADR, specs de lots
└─ .claude/                orchestration Claude Code (agents, règles, hooks)
```

## Flux clés

- **Lecture menu public** : domaine → `domain` → restaurant (cache court Redis) → menu publié (version
  immuable) → réponse cacheable par version.
- **Commande** : voir `payment-flow.md`.
- **Temps réel back-office** : Server-Sent Events depuis l'API (abonnement par établissement), repli sur
  polling 5 s ; pas de WebSocket au pilote.
- **Effets de bord** : écrits dans `outbox_message` dans la transaction métier ; le worker les exécute
  avec retry exponentiel, déduplication par clé, dead-letter après N essais, visibles au back-office.

## Choix structurants

| Sujet | Choix proposé | ADR |
|---|---|---|
| Style | Monolithe modulaire, un déployable API + un worker | 0001 |
| Monorepo | pnpm workspaces + Turborepo | 0002 |
| Accès données | Drizzle + migrations SQL relues | 0003 |
| Tenancy | Schéma partagé, `tenant_id`, RLS forcée | 0004 |
| Paiement | Stripe Connect direct charges | 0005 |
| États commande | Opérationnel et financier séparés | 0006 |
| Asynchrone | Outbox PostgreSQL | 0007 |
| Capacité | Réservations en PostgreSQL | 0008 |
| Identité | OIDC géré (personnel), invité (clients) | 0009 |
| Frontends | Deux apps Next.js | 0010 |
| Domaines | Sous-domaines au pilote, domaines perso + TLS auto ensuite | 0011 |
| Hébergement | Région suisse, à trancher | 0012 |
| Montants | Entiers + ISO 4217, snapshots | 0014 |
| Thème | Design tokens, pas de fork | 0015 |
