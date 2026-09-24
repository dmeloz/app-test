# Audit 1 — Lot L00 (socle technique) — 2026-09-24

- **Auditeur** : auditor-opus
- **Périmètre audité** : `de407dc..c1c5591` (commits `b5b0cdb`, `04ca8ac`, `d5a2437`, `c1c5591`), hors `docs/lots/L01-fondation-db`. Commit `9020ee5` hors périmètre (INFO I2).
- **Méthode** : tout rejoué sur un **clone propre** de `c1c5591` (Node 24.21.0, pnpm 12.6.0) ; dépôt de travail non modifié.
- **Vérifications rejouées** : install `--frozen-lockfile` EXIT=0 · `format:check` EXIT=0 · `lint` EXIT=0 · `typecheck` 11/11 EXIT=0 · `test` (api 20, domain 7, storefront 3, backoffice 3) EXIT=0 · `test-guards.sh` EXIT=0 · `build` 10/10 EXIT=0 · `timeout 400 pnpm test:e2e` → `4 passed (2.7s)` EXIT=0 (aussi avec `CI=true`), aucun `next-server` résiduel · `pnpm audit` → aucune vulnérabilité · API buildée + `curl` · config invalide · 14 sondes ESLint · simulation hors Docker de `turbo prune api --docker` · console navigateur · Docker Hub (lecture).
- **Non rejoué** : `docker build`, `docker compose up` (démon bloqué), aucun run GitHub Actions.

## Critères d'acceptation

| AC | Statut | Preuve |
|---|---|---|
| AC-L00-01 | OK | Clone propre : `pnpm install --frozen-lockfile` EXIT=0 |
| AC-L00-02 | OK | 5 commandes vertes sur clone propre |
| AC-L00-03 | Non vérifié (KO probable) | `compose.yaml:47` `minio/minio:RELEASE.2024-08-29T01-40-52Z` : Docker Hub → `object not found` (H4) |
| AC-L00-04 | OK | `/health/live` 200 `{"status":"ok"}` ; `/health/ready` 200 |
| AC-L00-05 | OK | Config invalide → EXIT=1, champ cité sans la valeur (API et worker) ; libellé L1 |
| AC-L00-06 | **KO** | En-tête OK mais **aucun log de requête ne contient `correlationId`** (`reqId: req-1`) ; logs Nest en texte (H2) |
| AC-L00-07 | OK | 1000n+250n=1250n CHF ; CHF+EUR → `MoneyError` ; 10.5 refusé |
| AC-L00-08 | **KO** | domain → `@nestjs/*` rejeté, mais **0 erreur sur 7 sondes** inter-apps / paquet→app en TS (H1) |
| AC-L00-09 | OK | e2e 4/4 deux fois, EXIT=0, aucun processus résiduel |
| AC-L00-10 | Non vérifié | Étapes présentes, mais gitleaks mal configuré (H5), audit critique non bloquant (M6), démonstration non faite |
| AC-L00-11 | **KO (simulation)** | `turbo prune` + build → `TS5083: Cannot read file '.../tsconfig.base.json'` (H3) |
| AC-L00-12 | OK | `test-guards.sh` EXIT=0 ; étape CI `ci.yml:49-50` |
| AC-L00-13 | OK | `bonjour.html` inchangé ; `.claude/`, `CLAUDE.md`, docs de cadrage non touchés |

## Constats

### [HIGH] H1 — Règle de frontières inter-apps / paquet→app inopérante sur du TypeScript
- **Emplacement** : `eslint.config.mjs:50-76` (aucun résolveur TypeScript pour `import-x`).
- **Preuve** : sondes storefront→backoffice, api→storefront (`.js`), storefront→api, packages/db→apps : exit=0. Contre-épreuve : import d'un `.js` existant (`api/dist/main.js`) → erreur. Les imports non résolus sont ignorés en silence. Le rapport (`implementation-report.md:168-169, 285`) affirme le contraire.
- **Correctif** : résolveur TypeScript (`eslint-import-resolver-typescript` via `import-x/resolver-next`) + interdiction par motif (`no-restricted-imports`) dans `packages/**`.
- **Test** : fixtures de lint commitées + test qui exécute `ESLint.lintFiles` et asserte `ruleId` et `severity === 2` pour chaque cas.

### [HIGH] H2 — Logs sans `correlationId`, logs Nest non JSON
- **Emplacement** : `apps/api/src/common/correlation/correlation.ts:30`, `apps/api/src/main.ts:28-38`, `apps/api/src/common/filters/http-exception.filter.ts:45,56`.
- **Preuve** : « incoming request » et « request completed » sans `correlationId`. Causes : log Fastify émis avant `onRequest`, `reply.log` non mis à jour, `Logger` Nest en texte coloré. Le rapport (`:230-232, 283`) affirme le contraire.
- **Correctif** : `FastifyAdapter` avec `requestIdHeader: "x-correlation-id"`, `genReqId` (validation + UUID), `requestIdLogLabel: "correlationId"` ; logs Nest en JSON (`ConsoleLogger({ json: true })`) ; filtre en JSON avec `correlationId`.
- **Test** : flux pino en mémoire ; chaque ligne est un JSON valide avec `correlationId === "t-1"`, sans en-tête brut.

### [HIGH] H3 — `api.Dockerfile` ne se construit pas (`tsconfig.base.json` absent après `turbo prune`)
- **Emplacement** : `infra/docker/api.Dockerfile:23-26`.
- **Correctif** : `COPY tsconfig.base.json ./` dans le stage builder ; job CI `docker build` + `docker run` (uid ≠ 0, `/health/live`), sans push, sans scan.
- **Test** : ce job CI.

### [HIGH] H4 — Image MinIO introuvable, healthcheck `curl` douteux
- **Emplacement** : `infra/docker/compose.yaml:47, 59`.
- **Correctif** : image compatible S3 disponible et épinglée, source vérifiée et documentée ; healthcheck qui utilise un binaire réellement présent dans l'image.
- **Test** : `docker compose up -d --wait` → 4 services `healthy` (humain ou CI).

### [HIGH] H5 — gitleaks : clone superficiel, `permissions` absentes
- **Emplacement** : `.github/workflows/ci.yml:21, 52-55`.
- **Correctif** : `fetch-depth: 0` ; `GITLEAKS_LICENSE` si le dépôt appartient à une organisation.
- **Test** : démonstration AC-L00-10 sur une branche jetable.

### [HIGH] H6 — `pnpm dev` ne démarre pas l'API (US-L00-1)
- **Emplacement** : `package.json:20`, `turbo.json:16-19`, `apps/api/package.json:11`.
- **Preuve** : le mode env strict de Turbo filtre `NODE_ENV` ; rien ne charge `.env`.
- **Correctif** : `env` / `passThroughEnv` dans `turbo.json` ; chargement explicite de `.env` (`node --env-file-if-exists` ou équivalent).
- **Test** : clone propre → `cp .env.example .env && pnpm install --frozen-lockfile && pnpm dev` → `curl /health/live` 200.

### [HIGH] H7 — Le rapport d'implémentation cite des preuves non réelles
- **Emplacement** : `implementation-report.md:156-169, 230-232, 283, 285` ; `apps/api/src/worker.ts:38` (test annoncé inexistant).
- **Correctif** : ne citer que des sorties réellement produites ; statuts AC corrigés ; retirer le commentaire trompeur.
- **Test** : l'audit 2 recoupe chaque sortie citée.

### [MEDIUM] M1 — La CSP des apps Next bloque les scripts inline de Next
`apps/*/next.config.ts:9-12`. Erreurs `Refused to execute inline script` en console. Correctif : CSP à nonce via proxy/middleware Next, ou hashes ; garder `frame-ancestors 'none'`. Test : e2e avec 0 erreur console et vérification des en-têtes.

### [MEDIUM] M2 — Couverture lint Next insuffisante, règles typées non activées
`eslint.config.mjs:39-40, 96-110`. Correctif : `eslint-config-next` en flat config sur les apps ; `recommendedTypeChecked` ; retirer `@eslint/eslintrc`. Test : fixtures `<img>` → `@next/next/no-img-element`, promesse non attendue → `no-floating-promises`.

### [MEDIUM] M3 — Le worker se termine immédiatement
`apps/api/src/worker.ts:28-35` (EXIT=0 après 118 ms). Correctif : maintenir un handle actif, nettoyé à l'arrêt. Test : spawn, toujours vivant à 1 s, SIGTERM → code 0 + « Worker arrêté ».

### [MEDIUM] M4 — `tsx` n'émet pas les métadonnées de décorateurs
`apps/api/package.json:11-12`. Correctif : `tsc -w` + `node --watch`, ou SWC. Test : un contrôleur avec un service injecté fonctionne en dev.

### [MEDIUM] M5 — Le test d'intégration recâble l'application à la main
`apps/api/test/health.integration.test.ts:17-29`. Correctif : `createApp(config, { logger })` partagé avec `main.ts`. Test : vérifier les en-têtes de sécurité et le format UUID.

### [MEDIUM] M6 — CI : pas de `permissions`, actions non épinglées par SHA, audit critique non bloquant
`ci.yml:1-16, 21-71, 58`. Correctif : `permissions: { contents: read }` ; actions épinglées par SHA ; `pnpm audit --prod --audit-level=critical` sans `|| true`.

### [MEDIUM] M7 — Image runtime non minimale, arrêt non propre
`api.Dockerfile:28-43`. Correctif : `pnpm deploy --prod` ; fichiers appartenant à root en lecture seule ; `tini`/`--init` ; `enableShutdownHooks()` ; healthcheck sur `${PORT}`.

### [MEDIUM] M8 — Risques structurels pour L01
`turbo.json`, `packages/*/package.json`, `eslint.config.mjs:10-24`. Correctif : paquets en ESM (`type`, `exports`) ou interop documentée ; variables Turbo déclarées ; `domain` en liste d'autorisation (pas de dépendances déclarées, `ImportExpression` interdit). Test : fixtures `pg`, `bullmq`, import dynamique.

### [LOW] L1–L7
- L1 : variable manquante annoncée comme « valeur invalide ».
- L2 : `money()` accepte des entiers non sûrs (utiliser `Number.isSafeInteger`).
- L3 : dépendances inutilisées (`@eslint/eslintrc`, `@app/domain` dans l'API).
- L4 : `X-Powered-By` à supprimer ; titres codés en dur ; `lang` non testé côté backoffice.
- L5 : `.dockerignore` sans `.env*` ; images épinglées par tag et non par digest ; patch postgres ancien.
- L6 : versions dupliquées entre la CI et `.nvmrc` / `packageManager`.
- L7 : `correlationId` client non filtré (`^[A-Za-z0-9._:-]{1,128}$`).

### [INFO]
- I1 : écarts justifiés (TS 6.0.3 imposé par la peerDependency de typescript-eslint, ESM, Node 24.21.0, `.prettierignore`, versions exactes).
- I2 : commit `9020ee5` (`.env.example` et règle de permission) à auditer au prochain passage.
- I3 : `bigint` non sérialisable en JSON, à prévoir dès L01/L03.

## Verdict

**CHANGES_REQUIRED** — les vérifications de base passent réellement sur un clone propre, mais 7 HIGH restent ouverts : AC-06, AC-08 et AC-11 sont KO, AC-03 est probablement KO, gitleaks est inopérant, `pnpm dev` ne fonctionne pas et le rapport contient des preuves non réelles. Correctifs localisés, sans remise en cause de l'architecture. Audit 2 requis.
