# Lot L01 — Fondation base de données multi-tenant

- **Statut** : VALIDÉ
- **Validé par / le** : le porteur (« Je valide L01 ») / 2026-09-24
- **Critique** : **OUI** (modèle multi-tenant, migrations PostgreSQL) → `auditor-opus` **et** `security-opus`
- **ADR liés** : 0003 (Drizzle), 0004 (tenancy + RLS), 0007 (outbox, table seulement), 0014 (montants)
- **Pré-requis** : L00 `APPROVED` et fusionné ; P01 (maquette) passe avant selon le planning validé ;
  **réserves de `docs/process/gates.md` levées par le porteur** (Docker Compose `up --wait` et `pnpm dev`
  sur un poste avec Docker) avant le démarrage de l'implémentation.
- **Branche** : `claude/opus-sonnet-workflow-gxnvua` (ou branche désignée pour la session)

## 1. Besoin et contexte

Toutes les données métier futures reposeront sur ce lot. Il doit garantir, **par construction et par
test**, qu'aucun tenant ne peut lire, modifier ou supprimer les données d'un autre, même en cas de bug
applicatif. C'est le lot le plus important pour la sécurité du produit : il ne doit pas être simplifié.

## 2. Périmètre

### Inclus
1. **Rôles PostgreSQL** créés par une migration d'amorçage :
   - `app_migrator` : propriétaire du schéma et des tables, utilisé uniquement pour les migrations ;
   - `app_runtime` : utilisé par l'API ; `NOSUPERUSER NOBYPASSRLS`, non propriétaire, privilèges minimaux ;
   - `app_worker` : utilisé par le worker ; mêmes contraintes que `app_runtime`.
   Les mots de passe viennent de variables d'environnement (valeurs factices en dev, jamais commitées réelles).
2. **Drizzle ORM** (ADR 0003) dans `packages/db` : schéma TypeScript, migrations **SQL** versionnées et
   relues, un script de migration `up` et une procédure `down` (script SQL inverse ou justification
   d'irréversibilité pour chaque migration).
3. **Tables** (colonnes détaillées § 6) : `tenant`, `restaurant`, `location`, `domain`, `audit_log`,
   `outbox_message`, `idempotency_key`.
4. **RLS** `ENABLE` + `FORCE` sur `restaurant`, `location`, `audit_log`, `outbox_message`,
   `idempotency_key` ; politique `tenant_id = current_setting('app.tenant_id', true)::uuid` pour
   SELECT/INSERT/UPDATE/DELETE (`USING` + `WITH CHECK`).
5. **Contexte transactionnel** dans `packages/db` : fonction unique
   `withTenant(tenantId, fn)` qui ouvre une transaction et exécute `SELECT set_config('app.tenant_id', $1, true)`
   (équivalent `SET LOCAL`) avant `fn`. Type `TenantId` « marqué » (branded) non constructible hors du
   module de résolution. Aucune autre façon d'accéder aux tables RLS depuis `app_runtime`.
6. **Accès opérateur** : fonction `withPlatformOperator(fn)` réservée, utilisant un rôle séparé
   `app_platform` avec politiques explicites sur `tenant` et `domain` uniquement (pas de lecture des
   tables métier au L01). Chaque usage écrit dans `audit_log`.
7. **Résolution de domaine** : fonction `resolveRestaurantByHost(host)` → `{ tenantId, restaurantId }`
   ou `null`, lisant `domain` (actif et vérifié uniquement). Pas encore branchée à une route publique.
8. **Harnais d'isolation** dans `packages/testing` : utilitaire générique qui, pour une table donnée,
   crée des lignes dans le tenant A puis, connecté en `app_runtime` avec le contexte B, vérifie que
   SELECT renvoie 0 ligne, UPDATE et DELETE affectent 0 ligne, et qu'un INSERT avec `tenant_id = A`
   est refusé. À appliquer à **chaque** table RLS (test paramétré qui échoue si une table RLS n'est pas
   couverte).
9. **Tests de garde** : un test échoue si `app_runtime` ou `app_worker` possède `BYPASSRLS`, est
   superutilisateur, ou possède une table ; un test échoue si une table contenant une colonne `tenant_id`
   n'a pas RLS `ENABLE` **et** `FORCE`.
10. **Seed synthétique** : 2 tenants, 1 restaurant et 1 établissement chacun, 1 domaine plateforme
    chacun (`<slug>.localhost`). Aucune donnée réelle.
11. **`/health/ready`** vérifie désormais PostgreSQL (requête simple en `app_runtime`) et Redis (PING).
12. **Tests d'intégration** sur PostgreSQL réel (conteneur via Compose en CI, ou Testcontainers) :
    `pnpm test:int` et `pnpm test:tenancy` deviennent effectifs et sont ajoutés à la CI.
13. Documentation : mise à jour de `docs/architecture/data-model.md` (colonnes réelles) et
    `docs/architecture/tenancy.md` si écart ; procédure de migration et de rollback dans `packages/db/README.md`.

### Exclu
Utilisateurs, sessions, rôles applicatifs (L02) · menus, commandes, paiements (L03+) · routes admin ·
chiffrement applicatif des champs (arrive avec la première donnée personnelle, L02 pour l'e-mail du
personnel) · worker de l'outbox (L12 ; seule la table est créée ici) · partitionnement de `audit_log`.

## 3. User stories
- **US-L01-1** En tant que porteur, je veux la preuve automatisée qu'un restaurant ne peut jamais accéder
  aux données d'un autre, afin de pouvoir le garantir contractuellement.
- **US-L01-2** En tant que développeur, je veux une seule façon sûre d'exécuter une requête dans le
  contexte d'un tenant, afin de ne pas pouvoir l'oublier.

## 4. Critères d'acceptation

- **AC-L01-01** `pnpm db:migrate` applique toutes les migrations sur une base vide ; `pnpm db:rollback`
  (ou procédure documentée) les annule dans l'ordre inverse ; test CI « up → down → up » réussi.
- **AC-L01-02** Connecté en `app_runtime`, **sans** contexte tenant, `SELECT * FROM restaurant` renvoie
  0 ligne (même si des données existent).
- **AC-L01-03** Connecté en `app_runtime` avec le contexte A : lecture des données de A uniquement ;
  UPDATE/DELETE ciblant une ligne de B affectent 0 ligne ; INSERT avec `tenant_id = B` échoue (violation
  de politique RLS).
- **AC-L01-04** Le harnais d'isolation couvre 100 % des tables RLS ; ajouter une table RLS non couverte
  fait échouer `pnpm test:tenancy`.
- **AC-L01-05** Un test échoue si `app_runtime`/`app_worker` a `rolbypassrls = true`,
  `rolsuper = true` ou possède une table (`pg_tables.tableowner`).
- **AC-L01-06** Un test échoue si une table avec colonne `tenant_id` n'a pas `relrowsecurity` et
  `relforcerowsecurity` à `true`.
- **AC-L01-07** Le contexte ne fuit pas entre transactions : après `withTenant(A, …)`, une nouvelle
  transaction sur la **même connexion du pool** sans contexte voit 0 ligne (test explicite avec un pool
  de taille 1).
- **AC-L01-08** FK composites : insérer une `location` avec `tenant_id = A` et `restaurant_id` d'un
  restaurant de B échoue (contrainte de clé étrangère), même avec le rôle migrateur.
- **AC-L01-09** `domain.hostname` est unique (insensible à la casse) ; `resolveRestaurantByHost` ignore
  les domaines non vérifiés ou inactifs ; tests unitaires et d'intégration.
- **AC-L01-10** `audit_log` et `outbox_message` : `app_runtime` peut INSERT et SELECT (dans son tenant)
  mais pas UPDATE ni DELETE sur `audit_log` (privilèges révoqués) ; test.
- **AC-L01-11** `idempotency_key` : contrainte unique (`tenant_id`, `key`) ; test de doublon.
- **AC-L01-12** `/health/ready` renvoie 503 avec `{ db: "down" }` si PostgreSQL est indisponible, 200
  sinon ; aucune information sensible dans la réponse.
- **AC-L01-13** La CI exécute `test:int` et `test:tenancy` sur PostgreSQL réel, en plus des étapes du L00.
- **AC-L01-14** Aucun mot de passe réel dans le dépôt ; `.env.example` documente les nouvelles variables
  (`DATABASE_URL_RUNTIME`, `DATABASE_URL_MIGRATOR`, `DATABASE_URL_WORKER`, `REDIS_URL`) sans valeur réelle.
- **AC-L01-15** Toutes les colonnes monétaires éventuelles (aucune attendue au L01) suivent l'ADR 0014 ;
  toutes les dates sont `timestamptz`.

## 5. Contrat API
Aucune nouvelle route. `/health/ready` enrichi (AC-L01-12) :
`{ "status": "ok"|"degraded", "checks": { "db": "up"|"down", "redis": "up"|"down" } }`.

## 6. Modèle de données

| Table | Colonnes | Contraintes / index | RLS |
|---|---|---|---|
| `tenant` | `id uuid pk`, `legal_name text not null`, `status text not null check in (onboarding, active, restricted, terminating, closed)`, `country char(2) not null default 'CH'`, `default_currency char(3) not null default 'CHF'`, `created_at`, `updated_at` | | Non (accès `app_platform` uniquement ; aucun privilège pour `app_runtime` sauf SELECT via fonction de résolution si nécessaire) |
| `restaurant` | `id`, `tenant_id not null fk tenant`, `slug text not null`, `legal_entity_name text not null`, `default_locale text not null default 'fr'`, `locales text[] not null default '{fr,en}'`, `status text not null`, `created_at`, `updated_at` | unique (`slug`) global ; unique (`tenant_id`,`id`) pour FK composites ; index (`tenant_id`) | Oui |
| `location` | `id`, `tenant_id`, `restaurant_id`, `name text`, `timezone text not null default 'Europe/Zurich'`, `pickup_enabled bool not null default false`, `delivery_enabled bool not null default false`, `created_at`, `updated_at` | FK (`tenant_id`,`restaurant_id`) → restaurant(`tenant_id`,`id`) ; unique (`tenant_id`,`id`) | Oui |
| `domain` | `id`, `tenant_id`, `restaurant_id`, `hostname text not null`, `kind text check in (platform_subdomain, custom)`, `verified_at timestamptz null`, `active bool not null default true`, `created_at` | unique (`lower(hostname)`) ; FK composite vers restaurant | Non (table de résolution) : `app_runtime` n'a que SELECT via fonction `SECURITY DEFINER` minimale renvoyant (`tenant_id`, `restaurant_id`) pour un hostname actif et vérifié — **à valider en audit** |
| `audit_log` | `id`, `tenant_id`, `actor_type text`, `actor_id text null`, `action text not null`, `target_type text`, `target_id text`, `diff jsonb null`, `correlation_id text`, `at timestamptz not null default now()` | index (`tenant_id`,`at desc`) ; UPDATE/DELETE révoqués | Oui |
| `outbox_message` | `id`, `tenant_id`, `topic text not null`, `payload jsonb not null`, `dedup_key text not null`, `status text not null default 'pending'`, `attempts int not null default 0`, `next_attempt_at timestamptz not null default now()`, `last_error text null`, `created_at` | unique (`dedup_key`) ; index (`status`,`next_attempt_at`) | Oui |
| `idempotency_key` | `id`, `tenant_id`, `key text not null`, `route text not null`, `request_hash text not null`, `response jsonb null`, `expires_at timestamptz not null`, `created_at` | unique (`tenant_id`,`key`) | Oui |

Identifiants : UUID v7 générés côté application (bibliothèque à justifier dans le rapport) ou
`gen_random_uuid()` (v4) si v7 introduit une dépendance jugée inutile — **consigner le choix**.

Rollback : chaque migration a son inverse ; la migration d'amorçage des rôles est documentée comme
réversible uniquement sur base vide.

## 7. Sécurité et tenancy
- Menaces couvertes : M1 (accès croisé), M15 partiel (agent sur la base : aucune migration hors base locale).
- Le `tenant_id` n'est jamais lu depuis une entrée utilisateur dans ce lot.
- `SET LOCAL` uniquement (portée transaction) — jamais `SET` de session (risque de fuite via le pool).
- Fonction `SECURITY DEFINER` de résolution de domaine : `search_path` fixé, propriétaire dédié,
  retour minimal ; revue explicite par `security-opus`.
- Aucune requête sur des tables RLS hors `withTenant` : règle ESLint ou test qui interdit l'import direct
  du client Drizzle brut en dehors de `packages/db`.

## 8. Plan de test (nominatif)
- Unitaires : `resolveRestaurantByHost` (normalisation de casse, domaine inactif, non vérifié) ; type `TenantId`.
- Intégration : migrations up/down/up ; AC-L01-02, 03, 07, 08, 09, 10, 11, 12.
- Isolation (`test:tenancy`) : harnais paramétré sur toutes les tables RLS (AC-L01-04) ; tests de garde
  des rôles et des flags RLS (AC-L01-05, 06).
- CI : AC-L01-13.

## 9. Observabilité
- Log de démarrage : version du schéma appliquée (sans URL de connexion).
- `withTenant` ajoute `tenantId` au contexte de log.
- `/health/ready` reflète l'état DB/Redis.

## 10. Risques, hypothèses, questions ouvertes
- **Pooler** (PgBouncer en mode transaction plus tard) : compatible avec `set_config(…, true)` ; à
  retester lors de l'ADR 0012.
- **Fonction `SECURITY DEFINER`** pour la résolution de domaine : alternative = rôle dédié
  `app_resolver` avec SELECT sur `domain` uniquement. Choix final à arbitrer en audit de spec.
- **UUID v7** : natif dans PostgreSQL 18 (`uuidv7()`) — vérifier la version de PostgreSQL retenue dans
  Compose et chez l'hébergeur ; sinon génération applicative.
- **Question pour le porteur** : aucune bloquante.

## 11. Fichiers attendus (indicatif)
`packages/db/{src/schema/*.ts,src/client.ts,src/with-tenant.ts,src/resolve-domain.ts,migrations/*.sql,drizzle.config.ts,README.md}`,
`packages/testing/src/tenancy-harness.ts`, `packages/db/test/**`, mise à jour de
`apps/api/src/health/**`, `infra/docker/compose.yaml` (script d'init des rôles), `.github/workflows/ci.yml`,
`.env.example`, `docs/architecture/{data-model,tenancy}.md`, `docs/lots/L01-fondation-db/implementation-report.md`.

## 12. Temps (heures du porteur)
| Cadrage | Validation/revue | Tests manuels | Total |
|---|---|---|---|
| | | | |
