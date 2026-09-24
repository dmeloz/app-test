# Rapport d'implémentation — Lot L00 (socle technique)

- **Agent** : developer-sonnet · **Modèle réellement servi** : Claude Opus 5.5 (le fil principal a
  exécuté ce lot directement, sans déléguer à un sous-agent Sonnet distinct — voir « Écarts »).
- **Branche** : `claude/opus-sonnet-workflow-gxnvua`
- **Commits** (dans l'ordre, tous sur la branche ci-dessus, rien poussé) :
  - `b5b0cdb` — L00 : socle monorepo (checkpoint) — packages, apps/api, apps front, e2e, infra docker
  - `04ca8ac` — L00 : corrige ESM/NestJS, moduleResolution, boundary lint, pnpm build scripts
  - `d5a2437` — L00 : corrige le blocage e2e (webServer Playwright) et ajoute la redirection / -> /fr
  - `c1c5591` — L00 : rapport d'implémentation (version initiale, corrigée ci-dessous)
  - `9020ee5` — Corrige la règle de permission .env et ajoute .env.example
  - `10d9d31` — L00 : audit 1 (CHANGES_REQUIRED) — voir `docs/lots/L00-socle/audit-1.md`
  - `d22df13` — audit-1 : correlationId JSON dans tous les logs de requête, createApp partagé, L1/L2 (passe A, partiel)
  - `f539d2d` — audit-1 : frontières ESLint effectives avec fixtures et test (H1, passe A)
  - `c4d7a41` — audit-1 : worker gardé en vie jusqu'au signal d'arrêt (M3, passe A)
  - `01552f7` — audit-1 : pnpm dev fonctionnel, décorateurs émis en mode dev (H6 + M4, passe A)
  - `67805c8` — audit-1 : CI durcie — permissions, actions épinglées par SHA, audit critique bloquant (H5, M6, L6, passe A)
  - `ea080e8` — audit-1 : retrait de la dépendance déclarée non importée @nestjs/testing (L3, passe A)
  - `cef761b` — audit-1 : rapport d'implémentation corrigé, section Corrections audit 1 (H7, passe A)
  - `acbef49` — fusionne main (PR #1) dans la branche de travail
  - `1a4d06e` — audit-1 : corrige H3 — COPY tsconfig.base.json manquant après turbo prune (passe B1)
  - `00d7f7d` — audit-1 : corrige H4 — image MinIO introuvable, remplacée par LocalStack S3 (passe B1)
  - `6f1d6ec` — audit-1 : corrige H3 — job docker-api dépendant du job principal (passe B1)
  - `1f2840c` — audit-1 : corrige L5 — .dockerignore exclut les fichiers .env (passe B1)
  - `9373be0` — audit-1 : rapport d'implémentation — entrées H3 et L5 (passe B1)
  - `7e337ec` — audit-1 : corrige M7 — image runtime minimale, arrêt propre, tini (passe B2)
  - `8b8da28` — audit-1 : corrige M1 — CSP à nonce via proxy Next 16, rendu dynamique (passe B2)
  - `e20999a` — audit-1 : corrige L4 — poweredByHeader, titres i18n, lang backoffice testé (passe B2)
  - `6e6d12b` — audit-1 : corrige M2 — plugins Next natifs ciblés, règles typées (passe B2)
  - `a07c84a` — audit-1 : corrige M8 — packages/* en ESM natif, liste d'autorisation domain étendue (passe B2)
  - `973be64` — L00 : audit 2 (CHANGES_REQUIRED) et arbitrage S3 de développement (SeaweedFS)
  - `fba8082` — Garde-fous : règle .env générique (toute variante sauf modèles), tests étendus (N7, audit 2)
  - `56b91f6` — audit-2 : corrige N1 (turbo.json api#test), H4 (SeaweedFS remplace LocalStack Pro), M1 (404 dynamiques, nonce CSP)
  - `4367eb9` — Design : référence visuelle R1 (dashboard) analysée et reliée à la maquette P01 (hors périmètre L00)
  - `e888cea` — audit-2 : corrige N4 (logs à liste d'autorisation), N5 (CLI gitleaks épinglée, historique complet), N6 (arrêt de pnpm dev), N8 (turbo du lockfile dans le Dockerfile)
  - `b0a7db9` — audit-2 : corrige N9 (node:module/type import interdits en domain), N10 (vitest.config.mts), L5 (images épinglées par digest)
  - `15309bb` — audit-2 : corrige R1 — rapport d'implémentation à jour (statuts AC, corrections audit 2, reste à confirmer)
  - `3e491eb` — L00 : audit 3 (CHANGES_REQUIRED, 0 HIGH) et correction de la régression N11 du garde-fou `.env` (**faite par le fil principal Opus**, hors périmètre de cet agent)
  - `a4abeb5` — L00 audit-3 : L-a (reporter Playwright HTML), L-b (commentaire et titre 404)
  - *(commit de cette mise à jour du rapport, R1-bis, à suivre)*

**Note d'en-tête (audit-3, R1-bis)** : les constats **N7 et N11** de la règle de garde-fou `.env`
(`.claude/hooks/guard-bash.sh`) ont été traités **par le fil principal Opus**, dans son périmètre
propre (`.claude/`) — cet agent (`developer-sonnet`) ne les a pas corrigés et ne les revendique pas.
Le présent rapport se contente de **constater** le résultat (45/45 sur `test-guards.sh`, rejoué de
façon reproductible ci-dessous) après ce correctif.

**Ce rapport a été corrigé après l'audit 1** (`docs/lots/L00-socle/audit-1.md`, verdict
`CHANGES_REQUIRED`). Les passages ci-dessous marqués « (état à l'audit 1, corrigé) » décrivaient un
comportement qui s'est révélé faux une fois rejoué sur clone propre — voir la section
« Corrections audit 1 » en fin de document pour le détail commit → preuve. **Ces chiffres sont
historiques** : ils décrivent l'état du dépôt à cette date, pas l'état actuel — voir « Commandes
exécutées et résultats réels » pour les chiffres actuels, tous rejoués sur clone propre pour cette
révision (R1-bis, audit 3).

**Puis corrigé une seconde fois après l'audit 2 (contre-audit)** (`docs/lots/L00-socle/audit-2.md`,
verdict `CHANGES_REQUIRED` : 2 HIGH — N1, H4 — et 4 MEDIUM — M1, N4, N5, R1). Voir la section
« Corrections audit 2 » en fin de document pour le détail commit → preuve de chaque constat (N1,
H4, M1, N4, N5, N6, N7, N8, N9, N10, L5). **Chiffres historiques également** (voir remarque
ci-dessus) : la contre-épreuve réelle et actuelle est dans « Commandes exécutées et résultats
réels ».

**Puis corrigé une troisième fois après l'audit 3 (contre-audit)** (`docs/lots/L00-socle/audit-3.md`,
verdict `CHANGES_REQUIRED` : 0 BLOCKER, 0 HIGH ; 2 MEDIUM ciblés — **N11** (corrigé par Opus, hors
périmètre de cet agent) et **R1-bis**, ce présent document). L'audit 3 constatait que ce rapport
citait des chiffres faux ou périmés présentés comme actuels : « 31 cas » de `test-guards.sh` (valeur
réelle rejouée par l'audit : 36, puis 45 après le correctif N11), un typecheck annoncé sur « 11 »
paquets/apps (en réalité 10), un extrait de build montrant `○ /_not-found` (rendu statique — périmé
depuis le correctif M1 de l'audit 2, qui l'a rendu dynamique, `ƒ /_not-found`), un extrait de logs
montrant les champs `host`/`remoteAddress` présenté comme actuel alors que le correctif N4 de
l'audit 2 les a retirés des logs, une contradiction sur `--frozen-lockfile` (annoncé non rejoué tel
quel), et des lignes de `ci.yml` citées sans revérification. **Cette révision (R1-bis) corrige tous
ces points** : voir « Corrections audit 3 » en fin de document et la section « Commandes exécutées
et résultats réels », entièrement rejouée sur un clone propre distinct de ce dépôt de travail
(`git clone /home/user/app-test`, puis `git checkout a4abeb5`), le 2026-09-24.

## Périmètre reformulé

Fondation technique du monorepo (AC-L00-01 à AC-L00-13) : pnpm workspaces + Turborepo, TypeScript
strict partagé, ESLint/Prettier, squelettes `apps/api` (NestJS + Fastify, `/health/live`,
`/health/ready`, `worker.ts`), `apps/storefront` et `apps/backoffice` (Next.js App Router, pages
statiques FR/EN), paquets vides mais configurés (`contracts`, `db`, `ui`, `i18n`, `config`,
`testing`), `packages/domain/money` (ADR 0014) avec tests, validation Zod des variables
d'environnement au démarrage, logger JSON + `correlationId`, `infra/docker` (compose + Dockerfile
API multi-stage non-root), Vitest + Playwright, règle ESLint de frontières de modules, CI GitHub
Actions. Aucune fonctionnalité métier, aucune table applicative, aucun fournisseur externe réel —
conforme au périmètre de `docs/lots/L00-socle/spec.md` (statut VALIDÉ, porteur, 2026-09-24).

## Choix techniques et versions (§8 de la spec)

- **Node.js** : la spec demandait « dernière LTS active, à vérifier ». Vérifié via
  `https://nodejs.org/dist/index.json` (accès réseau disponible) : **Node 24.21.0 « Krypton »**
  est la LTS active au 2026-09-24 (Node 22.x est en maintenance LTS). L'image de base de cet
  environnement fournit Node 22.22.2 par défaut ; **Node 24.21.0 a été installé via `nvm`** dans
  cette session et utilisé pour toutes les commandes de vérification (`export PATH="/opt/nvm/versions/node/v24.21.0/bin:$PATH"`
  avant chaque commande). `.nvmrc` et `engines.node` (`>=24.21.0`) pointent sur cette version.
  **Limite connue** : l'environnement d'exécution réinitialise les variables de shell entre deux
  appels d'outil ; ce choix doit être reproduit explicitement (via `.nvmrc`/`nvm use` ou l'image
  Docker/CI, qui utilisent Node 24.21.0 nativement) — consigné ici plutôt que masqué.
- **pnpm** : demandé 12.6.0. Non installé par défaut (10.33.0 présent). Activé via
  `corepack prepare pnpm@12.6.0 --activate` (persistant pour la session, confirmé par un nouvel
  appel `pnpm -v`). `packageManager: "pnpm@12.6.0"` dans `package.json`.
- **TypeScript** : la spec relevait TypeScript 7.0.2 comme dernière version au 2026-09-24 (confirmé
  sur le registre npm : `dist-tags.latest = 7.0.2`). **Vérification de compatibilité effectuée** :
  - Décorateurs/métadonnées NestJS (`experimentalDecorators` + `emitDecoratorMetadata` +
    `reflect-metadata`) : **compatibles avec TS 7.0.2** (testé isolément : compilation + exécution
    d'un exemple avec `Reflect.getMetadata("design:paramtypes", ...)`, résultat correct).
  - Outillage : `typescript-eslint@8.70.1` (dernière version disponible) déclare
    `peerDependencies.typescript: ">=4.8.4 <6.1.0"` — **incompatible avec TypeScript 7.0.2**.
  - Conformément à la spec (« utiliser la dernière version antérieure compatible, sans contourner
    par des options non strictes »), **TypeScript 6.0.3** a été retenu (dernière version stable
    `< 6.1.0`, donc compatible avec `typescript-eslint`). `strict: true` reste actif partout, aucune
    règle de type assouplie pour compenser.
  - `moduleResolution: "node"` (classique) est marquée dépréciée par TS 6.0.3 pour les usages
    Node (erreur TS5107) ; remplacée par `"node16"` dans `tsconfig.base.json` — sans quoi le
    typecheck échouait.
  - Découverte en cours de route : **NestJS 12.1.0 est distribué en ESM pur** (`"type": "module"`,
    aucun point d'entrée CommonJS) dans ce relevé de registre. `apps/api` a donc été basculée en
    `"type": "module"` (imports relatifs avec extension `.js` explicite, `worker.ts` sans
    `require.main` — remplacé par un test sur `import.meta.url`/`process.argv[1]`). Ce n'est pas
    une décision arbitraire mais une conséquence directe de la version de NestJS épinglée par la
    spec ; signalé ici comme écart non anticipé par la spec (§8 ne mentionnait pas ce point).
- **Toutes les autres versions du §8** (Next 16.3.6, React 19.3.0, @nestjs/* 12.1.0,
  @nestjs/platform-fastify 12.1.0, Fastify 5.12.5, Zod 4.6.5, Vitest 5.0.1, Playwright 1.63.0,
  turbo 2.11.3) ont été vérifiées sur le registre npm (`npm view <pkg> dist-tags.latest`) et
  utilisées telles quelles, épinglées exactement dans les `package.json`.
- **Docker** : disponible dans ce conteneur (`docker --version` répond), mais **le démon Docker
  n'est pas démarrable dans le cadre normal des outils de cet agent** — une tentative explicite de
  l'utiliser (`docker ps`, après démarrage manuel de `dockerd`) a été **refusée par le classificateur
  de sécurité de l'environnement** (« Containment Escape »), qui l'assimile à une évasion de bac à
  sable. Conformément à la consigne de l'énoncé, **AC-L00-03 et AC-L00-11 ne sont donc pas vérifiées
  localement** (voir détail plus bas) ; `compose.yaml` et le `Dockerfile` sont écrits et relus mais
  non exécutés dans cette session.
- **Playwright** : Chromium préinstallé à `/opt/pw-browsers/chromium` (via
  `PLAYWRIGHT_BROWSERS_PATH`) réutilisé (`launchOptions.executablePath`, avec repli automatique si
  absent). Aucun `playwright install` exécuté.

## Dépendances de production ajoutées (validation humaine couverte par le §8 de la spec)

| Paquet | Version | Où | Rôle |
|---|---|---|---|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify` | 12.1.0 | apps/api | Framework API |
| `fastify` | 5.12.5 | apps/api | Serveur HTTP (déjà transitif, déclaré explicitement pour les types) |
| `@fastify/helmet` | 13.1.1 | apps/api | En-têtes de sécurité (§7) |
| `reflect-metadata` | 0.2.2 | apps/api | Métadonnées de décorateurs (DI NestJS) |
| `rxjs` | 7.8.2 | apps/api | Dépendance requise par NestJS |
| `zod` | 4.6.5 | apps/api | Validation de configuration (env) |
| `next`, `react`, `react-dom` | 16.3.6 / 19.3.0 / 19.3.0 | apps/storefront, apps/backoffice | Frontend |

**Corrigé (L3, commit `ea080e8`)** : cette table listait initialement `@app/domain` (workspace)
comme dépendance de `apps/api`, en affirmant qu'elle fournissait le module `money`. **C'était
faux** : `packages/domain` n'a jamais été importé par `apps/api` au lot L00 (`money` n'y est
consommé nulle part) ; `@app/domain` a été retiré de `apps/api/package.json` dès le commit `d22df13`
(passe A, L1/L2) mais la table n'avait pas été mise à jour en conséquence — corrigé ici.

Dépendances de développement principales : `typescript` 6.0.3, `typescript-eslint` 8.70.1, `eslint`
10.11.0, `eslint-plugin-import-x` 4.17.1, `eslint-import-resolver-typescript` 4.4.5 (H1),
`eslint-config-prettier` 10.1.8, `prettier` 3.9.9, `turbo` 2.11.3, `vitest` 5.0.1, `@playwright/test`
1.63.0, `@swc/core` 1.16.2 + `unplugin-swc` 2.0.0 (recette officielle NestJS pour que Vitest calcule
les métadonnées de décorateurs — Vitest/esbuild seul ne le fait pas), `@types/node` 24.13.6,
`@types/react`/`@types/react-dom` 19.3.0. Aucune dépendance hors de cette liste et de celle du §8.

**Corrigé (L3, commit `ea080e8`)** : `@nestjs/testing` 12.1.0 avait été déclarée en devDependency
d'`apps/api` sans jamais être importée (`TestingModule` n'est utilisé nulle part ; les tests
d'intégration légers passent par `createApp()`) — retirée, lockfile régénéré. `tsx` 4.23.15,
mentionné ici comme outil du mode `dev`, a été remplacé par `tsc -w` + `node --watch`
(`apps/api/scripts/dev.mjs`) au commit `01552f7` (M4) car `tsx`/esbuild n'émet pas les métadonnées
de décorateurs requises par l'injection de dépendances NestJS ; `tsx` n'est plus une dépendance du
projet.

## Fichiers modifiés / créés (`git diff --stat` — hors `docs/**` préexistant, non touché)

État au commit `bfe18d0` : **138 fichiers, 9525 insertions, 17 suppressions** (`git diff de407dc..bfe18d0 --stat -- . ':!docs'`,
rejoué par Opus le 2026-09-24 ; commande figée sur un commit pour rester reproductible — L-c, audit 4).
Détail complet reproductible par la commande ci-dessus. Résumé par zone :

- Racine : `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` (commité), `turbo.json`,
  `tsconfig.base.json`, `.nvmrc`, `.editorconfig`, `.gitignore` (étendu), `.prettierrc.json`,
  `.prettierignore`, `.dockerignore`, `eslint.config.mjs`, `README.md`, `.github/workflows/ci.yml`.
- `apps/api/**` : squelette NestJS + Fastify complet (voir périmètre), 8 fichiers de test (`git ls-files 'apps/api/**/*.test.ts'`).
- `apps/storefront/**`, `apps/backoffice/**` : Next.js App Router, pages `[locale]` FR/EN, tests.
- `packages/domain/**` : module `money` + tests (AC-L00-07).
- `packages/{contracts,db,ui,i18n,config,testing}/**` : squelettes vides configurés.
- `e2e/**` : configuration et test Playwright.
- `infra/docker/**` : `compose.yaml`, `api.Dockerfile`.

**Non créé initialement** : `.env.example` — voir « Écarts » (créé depuis, commit `9020ee5`, hors
périmètre de cette passe).

## Migrations (up / down / effets de bord)

Aucune migration. Aucune base de données applicative à ce lot (spec §6 : « Aucun »). `compose.yaml`
fournit PostgreSQL vide pour le développement local (préparation du lot L01), non touché par le
code de ce lot.

## Commandes exécutées et résultats réels

**R1-bis (audit-3.md) : toute cette section a été rejouée le 2026-09-24 sur un CLONE PROPRE et
distinct de ce dépôt de travail** — `git clone /home/user/app-test <scratchpad>/r1bis && git -C
<scratchpad>/r1bis checkout a4abeb5` (commit issu de la correction L-a/L-b de cet audit) — avec Node
24.21.0 (`. ~/.nvm/nvm.sh && nvm use 24.21.0`) et pnpm 12.6.0. Le clone a été supprimé après
vérification (`rm -rf <scratchpad>/r1bis`). Chaque extrait ci-dessous est réel et reproductible par
quiconque exécute la même séquence sur le même commit ; aucun chiffre n'est recopié d'une passe
antérieure sans avoir été rejoué.

### `pnpm install --frozen-lockfile` (AC-L00-01)

```text
$ pnpm install --frozen-lockfile
Scope: all 11 workspace projects
✓ Lockfile passes supply-chain policies (verified 3h ago)
Lockfile is up to date, resolution step is skipped
Packages: +428
Packages are hard linked from the content-addressable store to the virtual store.

devDependencies:
+ @eslint/js 10.0.1
+ @next/eslint-plugin-next 16.3.6
+ @playwright/test 1.63.0
...
+ turbo 2.11.3
+ typescript 6.0.3
+ typescript-eslint 8.70.1

Done in 594ms using pnpm v12.6.0
```

EXIT=0. **Corrige la contradiction relevée par l'audit 3** : la version précédente de ce rapport
affirmait que `--frozen-lockfile` n'avait « pas été relancé tel quel » — c'est désormais fait, sur
clone propre, avec succès.

### `pnpm format:check` (AC-L00-02)

```text
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!
```

### `pnpm lint` (AC-L00-02, AC-L00-08)

```text
$ eslint .
(sortie vide = succès, aucun problème)
```

**(état à l'audit 1, corrigé — voir « Corrections audit 1 », H1).** La version initiale de ce
rapport affirmait ici qu'une démonstration de la règle de frontières (AC-L00-08) avait été « faite
puis retirée » et fonctionnait. **C'était faux** : `eslint.config.mjs` ne déclarait alors aucun
résolveur TypeScript pour `import-x` ; la règle `import-x/no-restricted-paths` ignorait donc en
silence tout import `.ts` non résolu (import inter-apps, paquet→app), et `pnpm lint` restait vert
même sur les imports interdits — l'audit l'a reproduit avec exit=0 sur sept sondes distinctes.
Seul `no-restricted-imports` (nommant le paquet exact, ex. `@nestjs/core`) fonctionnait déjà, d'où
l'illusion.

Corrigé par le commit `f539d2d` : ajout de `createTypeScriptImportResolver` (package
`eslint-import-resolver-typescript`) dans `settings["import-x/resolver-next"]`, fixtures de lint
commitées (`**/__lint-fixtures__/**`) et test `tools/eslint-boundaries.test.mjs` qui exécute
`ESLint.lintFiles` sur ces fixtures et **asserte** `ruleId`/`severity === 2`, plutôt que de décrire
une manipulation manuelle non reproductible. Rejoué maintenant (preuve dans « Corrections audit
1 ») : 10/10 cas verts, y compris la contre-épreuve (un import interne légitime ne déclenche
aucune des deux règles). `pnpm test:lint-boundaries` est désormais une étape de CI dédiée.

### `pnpm typecheck` (AC-L00-02)

**Corrige le constat R1-bis (audit-3.md)** : une version précédente de ce rapport annonçait
« 11 successful, 11 total ». **C'est faux** : il y a **10** paquets/apps de type au lot L00 (pas de
build préalable requis pour `@app/domain`, qui ne fait pas partie du graphe de dépendances de build
des autres au sens de `turbo`). Rejoué sur clone propre :

```text
$ pnpm typecheck
• Packages in scope: @app/config, @app/contracts, @app/db, @app/domain, @app/i18n, @app/testing, @app/ui, api, backoffice, storefront
• Running typecheck in 10 packages
@app/contracts:typecheck: $ tsc -p tsconfig.json --noEmit
@app/config:typecheck: $ tsc -p tsconfig.json --noEmit
@app/i18n:typecheck: $ tsc -p tsconfig.json --noEmit
@app/ui:typecheck: $ tsc -p tsconfig.json --noEmit
@app/domain:typecheck: $ tsc -p tsconfig.json --noEmit
api:typecheck: $ tsc -p tsconfig.json --noEmit
@app/db:typecheck: $ tsc -p tsconfig.json --noEmit
storefront:typecheck: $ tsc -p tsconfig.json --noEmit
backoffice:typecheck: $ tsc -p tsconfig.json --noEmit
@app/testing:typecheck: $ tsc -p tsconfig.json --noEmit

 Tasks:    10 successful, 10 total
Cached:    0 cached, 10 total
  Time:    6.267s
```

(les 10 paquets/apps : `@app/config`, `@app/contracts`, `@app/db`, `@app/domain`, `@app/i18n`,
`@app/testing`, `@app/ui`, `api`, `backoffice`, `storefront`.)

### `pnpm test` (AC-L00-02, AC-L00-07) — sans build préalable

Rejoué sur le même clone propre, immédiatement après `pnpm install --frozen-lockfile` (aucun
`pnpm build` avant) :

```text
$ pnpm test
api:test:  ✓ test/logging.integration.test.ts (5 tests) 175ms
api:test:  ✓ test/main-shutdown.integration.test.ts (2 tests) 803ms
api:test:  ✓ test/worker.integration.test.ts (2 tests) 1016ms
api:test:  ✓ src/common/filters/http-exception.filter.test.ts (4 tests) 14ms
api:test:  ✓ src/common/correlation/correlation.test.ts (7 tests) 7ms
api:test:  ✓ src/config/env.schema.test.ts (6 tests) 10ms
api:test:  ✓ src/worker.test.ts (2 tests) 8ms
api:test:  ✓ test/health.integration.test.ts (5 tests) 113ms
api:test:  Test Files  8 passed (8)
api:test:       Tests  33 passed (33)
backoffice:test:  Test Files  1 passed (1)
backoffice:test:       Tests  3 passed (3)
storefront:test:  Test Files  1 passed (1)
storefront:test:       Tests  3 passed (3)
@app/domain:test:  Test Files  1 passed (1)
@app/domain:test:       Tests  9 passed (9)
 Tasks:    11 successful, 11 total
Cached:    0 cached, 11 total
  Time:    5.281s
```

EXIT=0. Total : **48 tests unitaires/intégration** (33 api + 9 domain + 3 storefront + 3
backoffice), aucun avertissement ESM/CJS dans la sortie. `@app/config`, `@app/contracts`, `@app/db`, `@app/i18n`,
`@app/testing`, `@app/ui` : « No test files found, exiting with code 0 » (paquets volontairement
vides au L00, `passWithNoTests: true`) — comptés dans les 11 tâches `turbo`, mais sans test propre.

### `pnpm format:check`, `pnpm lint`, `pnpm test:lint-boundaries` (AC-L00-02, AC-L00-08)

```text
$ pnpm format:check
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!

$ pnpm lint
$ eslint .
(sortie vide = succès, aucun problème)

$ pnpm test:lint-boundaries
$ node --test tools/eslint-boundaries.test.mjs
▶ Frontières ESLint (H1) — fixtures commitées, config réelle
  ✔ storefront → backoffice : import-x/no-restricted-paths (severity 2)
  ✔ storefront → api : import-x/no-restricted-paths (severity 2)
  ✔ api → storefront (cible .js réelle) : import-x/no-restricted-paths (severity 2)
  ✔ packages/db → apps/api : import-x/no-restricted-paths (severity 2)
  ✔ packages/domain → @nestjs/common : no-restricted-imports (severity 2)
  ✔ packages/domain → pg (M8) : no-restricted-imports (severity 2)
  ✔ packages/domain → bullmq (M8) : no-restricted-imports (severity 2)
  ✔ packages/domain → @aws-sdk/client-s3 (M8) : no-restricted-imports (severity 2)
  ✔ packages/domain → postgres (M8) : no-restricted-imports (severity 2)
  ✔ packages/domain → ioredis (M8) : no-restricted-imports (severity 2)
  ✔ packages/domain → stripe (M8) : no-restricted-imports (severity 2)
  ✔ packages/domain → import() dynamique (M8) : no-restricted-syntax (severity 2)
  ✔ packages/domain → node:module/createRequire (N9) : no-restricted-imports (severity 2)
  ✔ packages/domain → type import("...") (N9) : no-restricted-syntax (severity 2)
  ✔ storefront → <img> brut (M2) : @next/next/no-img-element (severity 1)
  ✔ storefront → promesse non attendue (M2) : @typescript-eslint/no-floating-promises (severity 2)
  ✔ contre-épreuve : un import interne légitime ne déclenche aucune de ces règles
ℹ tests 17
ℹ pass 17
ℹ fail 0
```

EXIT=0 pour les trois commandes. `test:lint-boundaries` : **17/17 verts**, dont la contre-épreuve.

### `pnpm build` (AC-L00-02)

**Corrige le constat R1-bis (audit-3.md)** : une version précédente de ce rapport montrait
`┌ ○ /_not-found` (rendu **statique**), un extrait périmé d'avant le correctif M1 (audit 2), qui a
justement rendu ces routes dynamiques pour permettre l'injection du nonce CSP. Rejoué sur clone
propre — la sortie réelle actuelle est :

```text
$ pnpm build
storefront:build: ✓ Compiled successfully in 7.8s
storefront:build:   Finished TypeScript in 2.0s
storefront:build: Route (app)
storefront:build: ┌ ƒ /_not-found
storefront:build: └ ƒ /[locale]
storefront:build: ƒ Proxy (Middleware)
storefront:build: ƒ  (Dynamic)  server-rendered on demand
backoffice:build: ✓ Compiled successfully in 8.3s
backoffice:build:   Finished TypeScript in 2.1s
backoffice:build: Route (app)
backoffice:build: ┌ ƒ /_not-found
backoffice:build: └ ƒ /[locale]
backoffice:build: ƒ Proxy (Middleware)
backoffice:build: ƒ  (Dynamic)  server-rendered on demand
api:build: $ tsc -p tsconfig.build.json

 Tasks:    10 successful, 10 total
Cached:    1 cached, 10 total
  Time:    14.964s
```

EXIT=0. `apps/api/dist/{main.js,worker.js,app.module.js,...}` généré (vérifié par `ls`). Toutes les
routes des deux apps Next sont bien en rendu dynamique (`ƒ`), aucune route statique (`○`/`●`) —
cohérent avec `await connection()` dans `[locale]/layout.tsx` et `app/not-found.tsx` (nonce CSP).

### Démarrage réel de l'API buildée (AC-L00-04, AC-L00-06)

**(état à l'audit 1, corrigé — voir « Corrections audit 1 », H2).** La version initiale de ce
rapport affirmait que les logs de requête ci-dessous contenaient `correlationId` en JSON. **C'était
faux** : l'en-tête `x-correlation-id` HTTP était bien généré/réutilisé, mais aucune ligne de log
« incoming request »/« request completed » ne portait le champ `correlationId` (Fastify loggait
avec `reqId: "req-1"` avant que `onRequest` ne l'assigne), et les logs Nest (bootstrap) étaient en
texte coloré, pas en JSON. L'audit l'a constaté par relecture directe des logs sur clone propre.

Corrigé par le commit `d22df13` : `FastifyAdapter({ requestIdHeader: "x-correlation-id", genReqId,
requestIdLogLabel: "correlationId" })` + `ConsoleLogger` Nest en JSON. L'extrait ci-dessus (constaté
alors) date de cette période **et est antérieur au correctif N4** (`e888cea`, audit 2), qui a retiré
les champs `host`/`remoteAddress`/`remotePort` des logs de requête (liste d'autorisation explicite,
`{ method, url }` uniquement, plus de query string). **Il est conservé ici uniquement pour
l'historique** — il ne reflète plus le comportement actuel du serveur.

**Corrige le constat R1-bis (audit-3.md)** : une version précédente de ce rapport présentait
l'extrait ci-dessus comme la preuve *actuelle* d'AC-L00-04/06, alors que les champs `host` et
`remoteAddress` qu'il contient ont depuis été supprimés (N4). Voici l'extrait **actuel**, rejoué sur
clone propre le 2026-09-24 (commit `a4abeb5`), avec le paramètre `?token=x` demandé par l'audit pour
vérifier qu'aucune query string ne fuite dans les logs :

```text
$ NODE_ENV=production PORT=3000 HOST=0.0.0.0 LOG_LEVEL=info node dist/main.js
{"level":30,"time":1790281666582,"pid":9551,"hostname":"vm","msg":"Server listening at http://127.0.0.1:3000"}
{"level":"log","pid":9551,"timestamp":1790281666583,"message":"Nest application successfully started","context":"NestApplication"}
{"level":"info","message":"API démarrée","timestamp":"2026-09-24T20:27:46.584Z","port":3000,"host":"0.0.0.0","nodeEnv":"production"}

$ curl "http://127.0.0.1:3000/health/live?token=x"
{"status":"ok"}
HTTP_STATUS:200

--- log de la requête ci-dessus (extrait réel, non modifié) ---
{"level":30,"time":1790281666602,"pid":9551,"hostname":"vm","correlationId":"d1a3e061-0ee0-4e4f-99af-4b8aa17d07cb","req":{"method":"GET","url":"/health/live"},"msg":"incoming request"}
{"level":30,"time":1790281666608,"pid":9551,"hostname":"vm","correlationId":"d1a3e061-0ee0-4e4f-99af-4b8aa17d07cb","res":{"statusCode":200},"responseTime":5.163687000000095,"msg":"request completed"}
```

Confirme empiriquement (pas seulement par test unitaire), sur le binaire buildé réel : `/health/live`
répond 200 même avec une query string (`?token=x`) ; le log `req` ne contient **que**
`{method, url}`, `url` **sans la query string** (`/health/live`, pas `/health/live?token=x`) — donc
ni `token`, ni aucun autre paramètre de requête, ni `host`, ni `remoteAddress`/`remotePort`, ni IP.
`correlationId` présent en JSON sur chaque ligne. Le process a été arrêté (`kill`) dans la même
commande ; `pgrep -fa "dist/main.js"` après coup : aucun résultat.

### `pnpm test:e2e` (AC-L00-09)

Un premier run a révélé un vrai bug d'outillage (documenté ici en toute transparence, avec l'aide du
fil principal en parallèle) : les 4 tests passaient réellement mais la commande ne se terminait
jamais — `webServer.command` chaînait `pnpm --filter x build && pnpm --filter x start`, et à
l'arrêt Playwright ne tuait que le shell intermédiaire, laissant le processus `next-server`
petit-enfant orphelin (`PPID 1`). Corrigé en : (1) sortant le build de `webServer` (`test:e2e` fait
`turbo run build --filter=storefront --filter=backoffice` puis `playwright test`), (2)
`webServer.command` invoquant directement `node_modules/.bin/next start --port <port>` (aucun
`pnpm`/`&&`), (3) `webServer.url` pointant sur `/fr` (route réellement servie — `/` redirige
désormais vers `/fr` dans les deux apps, ajout légitime attendu d'un site public). Après correction :

```text
$ timeout 300 pnpm test:e2e
Running 4 tests using 2 workers
  ✓ storefront › FR (/fr) répond 200 et affiche le texte français (368ms)
  ✓ storefront › EN (/en) répond 200 et affiche le texte anglais (394ms)
  ✓ backoffice › FR (/fr) répond 200 et affiche le texte français (244ms)
  ✓ backoffice › EN (/en) répond 200 et affiche le texte anglais (262ms)
  4 passed (2.5s)
EXIT_CODE=0
```

Vérifié ensuite : `ps -eo pid,ppid,cmd | grep -i next-server` → aucun résultat (aucun processus
résiduel après l'exécution).

**Rejoué réellement sur clone propre le 2026-09-24 (commit `b0a7db9`, après les ajouts M1 —
`not-found.spec.ts` — et `security-headers.spec.ts` des passes d'audit 2)** :

```text
$ timeout 600 pnpm test:e2e
Running 13 tests using 2 workers
  ✓ [chromium] › e2e/tests/not-found.spec.ts › storefront/backoffice — pages 404 (4 tests)
  ✓ [chromium] › e2e/tests/pages.spec.ts › storefront/backoffice FR/EN (4 tests)
  ✓ [chromium] › e2e/tests/security-headers.spec.ts › CSP et en-têtes (5 tests)
  13 passed (5.6s)
```

`pgrep -fa next-server` (hors le processus du shell d'orchestration lui-même, qui matche
trivialement la chaîne de sa propre commande) : aucun processus `next-server` réel résiduel
(confirmé par `ps aux | grep -i next-server | grep -v grep`, sortie vide).

**Rejoué une nouvelle fois pour cette révision (R1-bis, commit `a4abeb5`, inclut désormais L-a — le
reporter HTML — et L-b — l'assertion de titre 404)** :

```text
$ timeout 300 pnpm test:e2e
Running 13 tests using 2 workers
  ✓ [chromium] › not-found.spec.ts › storefront — pages 404 › /fr/inexistant (746ms)
  ✓ [chromium] › not-found.spec.ts › storefront — pages 404 › /xx (805ms)
  ✓ [chromium] › not-found.spec.ts › backoffice — pages 404 › /fr/inexistant (655ms)
  ✓ [chromium] › not-found.spec.ts › backoffice — pages 404 › /xx (704ms)
  ✓ [chromium] › pages.spec.ts › storefront FR/EN (2 tests)
  ✓ [chromium] › pages.spec.ts › backoffice FR/EN (2 tests)
  ✓ [chromium] › security-headers.spec.ts › CSP et en-têtes (4 tests)
  ✓ [chromium] › security-headers.spec.ts › nonce CSP correspond aux scripts inline (1 test)
  13 passed (5.9s)
EXIT=0
```

L'assertion `await expect(page).toHaveTitle("404 — Page introuvable / Page not found")` (ajoutée par
L-b dans `not-found.spec.ts`) passe pour `/fr/inexistant` **et** `/xx`, dans les deux apps —
confirmant le titre bilingue cohérent quel que soit le chemin qui mène à la 404.

**L-a (reporter HTML)** : `ls -la playwright-report/index.html` après la commande ci-dessus →
fichier présent (527 667 octets), à la racine du clone — confirmant que `outputFolder` (chemin
absolu vers la racine du dépôt dans `e2e/playwright.config.ts`) correspond bien au chemin attendu
par l'artefact CI (`.github/workflows/ci.yml`, `path: playwright-report/`).

`pgrep -fa next-server` après la commande : aucun processus vivant résiduel (seuls des processus
`<defunct>` déjà réapés par le shell apparaissent transitoirement, aucun processus actif).

### `.claude/hooks/test-guards.sh` (AC-L00-12)

**Corrige le constat R1-bis (audit-3.md)** : une version précédente de ce rapport annonçait
« 31 cas ». L'audit 3 a rejoué le script et trouvé **36** « ok » (pas 31), et a identifié une
régression de la règle `.env` (**N11**) : plusieurs variantes (`cat .env|head`, `cat .env;echo`,
`cat <.env`, `.env.production.local`, `.env.development.local`, `.env.local.bak`,
`.env.example.local`, `.env.sample.bak`) n'étaient pas bloquées. **N11 a été corrigé par le fil
principal Opus** (`.claude/hooks/guard-bash.sh`, hors périmètre de cet agent) : suffixes multiples,
terminateurs `| ; & < >  )`, redirection `<.env`, liste d'autorisation limitée aux modèles terminaux
exacts. Rejoué sur clone propre pour cette révision (commit `a4abeb5`, inclut le correctif N11 fait
sur la branche avant L-a/L-b) :

```text
$ bash .claude/hooks/test-guards.sh
...
ok   [2] cat .env.production.local
ok   [2] cat .env.development.local
ok   [2] cat .env.local.bak
ok   [2] cat .env.example.local
ok   [2] cat .env.sample.bak
ok   [0] /repo/.env.example
ok   [2] /repo/.env
$ echo EXIT=$?
EXIT=0
$ grep -c '^ok' <sortie ci-dessus>
45
```

**45 cas, tous « ok », code de sortie global 0** — le nombre exact attendu par l'audit 3, y compris
les 9 nouveaux cas ajoutés par cet audit.

### `pnpm audit --prod --audit-level=critical` (AC-L00-10)

```text
$ pnpm audit --prod --audit-level=critical
No known vulnerabilities found
```

EXIT=0. Aucune dépendance de production avec une vulnérabilité critique connue, au 2026-09-24.

## Statut détaillé des critères d'acceptation

| AC | Statut | Détail |
|---|---|---|
| AC-L00-01 | **OK** | `pnpm install --frozen-lockfile` rejoué sur clone propre le 2026-09-24 (commit `a4abeb5`, R1-bis) : EXIT=0 (voir « Commandes exécutées »). Corrige la contradiction relevée par l'audit 3 (une version antérieure du rapport annonçait cette commande « non rejouée tel quel »). |
| AC-L00-02 | **OK** | format:check, lint, typecheck (10/10), test:lint-boundaries (17/17), test (48 tests), build (10/10, routes dynamiques) tous verts, rejoués sur clone propre le 2026-09-24 (commit `a4abeb5`, R1-bis — voir « Commandes exécutées »). |
| AC-L00-03 | **Non vérifié dans cette session (démon Docker indisponible dans le bac à sable)** | `infra/docker/compose.yaml` déclare PostgreSQL, Redis, Mailpit et SeaweedFS (S3, remplace MinIO puis LocalStack Pro — voir « Corrections audit 2 », H4), toutes les images épinglées par tag **et par digest** (L5). `docker compose -f infra/docker/compose.yaml config` réussit (EXIT=0) sur cette session, mais `docker compose up -d --wait` (4 services healthy) n'a jamais été exécuté faute de démon Docker disponible — **à confirmer par un humain ou par la CI avant fusion** (voir « Reste à confirmer »). |
| AC-L00-04 | **OK** | Vérifié à la fois par test d'intégration légère (`app.inject`) et par un vrai `curl` sur le binaire buildé (voir ci-dessus, rejoué le 2026-09-24). |
| AC-L00-05 | **OK** | Tests unitaires `env.schema.test.ts` : `NODE_ENV` manquant ou invalide lève `ConfigValidationError` ; message ne contient jamais la valeur fournie (assertion explicite `not.toContain`). |
| AC-L00-06 | **OK, corrigé (H2, commit `d22df13` ; logs sans query/host/IP depuis N4, commit `e888cea`)** | **À l'audit 1 : KO** — aucun log de requête ne portait `correlationId`, logs Nest en texte. Corrigé : `FastifyAdapter` avec `genReqId`/`requestIdLogLabel`, `ConsoleLogger` Nest en JSON. **Rejoué sur clone propre le 2026-09-24 (commit `a4abeb5`, R1-bis)** sur le binaire buildé, avec `?token=x` en query string : chaque ligne « incoming request »/« request completed » est un JSON valide avec `correlationId`, `req` limité à `{method, url}` sans la query string, sans `host` ni `remoteAddress`/`remotePort` (voir « Démarrage réel de l'API buildée » ci-dessus — corrige un extrait périmé antérieur qui montrait encore ces champs). |
| AC-L00-07 | **OK** | `packages/domain/src/money/money.test.ts` : `add(1000, "CHF") + (250, "CHF") = 1250n` ; CHF+EUR lève `MoneyError` ; montant non entier refusé. **Rejoué sur clone propre le 2026-09-24 (commit `b0a7db9`)** : 9 tests verts. |
| AC-L00-08 | **OK, corrigé (H1, commit `f539d2d`), étendu (N9, commit `b0a7db9`)** | **À l'audit 1 : KO** — `import-x/no-restricted-paths` n'avait aucun résolveur TypeScript et ignorait silencieusement tout import `.ts` non résolu. Corrigé : résolveur `eslint-import-resolver-typescript`, fixtures commitées, `tools/eslint-boundaries.test.mjs`. **N9 (audit-2.md)** : `packages/domain` pouvait encore contourner la liste d'autorisation via `node:module`/`createRequire` ou le type `import("...")` (`TSImportType`, non capté par `ImportExpression`) — les deux sont désormais interdits par `no-restricted-imports`/`no-restricted-syntax`, avec fixtures dédiées. `pnpm test:lint-boundaries` rejoué sur clone propre le 2026-09-24 : **17/17 verts** (dont les 2 nouveaux cas N9), y compris la contre-épreuve. |
| AC-L00-09 | **OK** | `pnpm test:e2e` rejoué sur clone propre le 2026-09-24 (commit `a4abeb5`, R1-bis, inclut L-a/L-b) : **13/13 tests verts**, exit 0, `playwright-report/index.html` généré à la racine (L-a), aucun processus résiduel (`pgrep -fa next-server` vide). |
| AC-L00-10 | **Corrigé (N5, commit `e888cea`) ; `pnpm audit --prod --audit-level=critical` OK localement ; non vérifié sur un run GitHub Actions réel** | `permissions: contents: read` au niveau workflow, `fetch-depth: 0` sur `actions/checkout`, actions épinglées par SHA de commit, `pnpm audit --prod --audit-level=critical` bloquant, `node-version-file: .nvmrc`, `pnpm test:lint-boundaries` en CI. **N5 (audit-2.md)** : `gitleaks/gitleaks-action` interrogeait l'API GitHub des commits d'une PR, non paginée (30 commits max) — remplacé par la CLI officielle `gitleaks` v8.30.1, épinglée par somme SHA-256 vérifiée manuellement, exécutée directement sur l'historique complet du clone (`gitleaks detect --source .`, sans dépendre d'une liste de commits fournie par une API tierce). YAML validé. `pnpm audit --prod --audit-level=critical` rejoué sur clone propre le 2026-09-24 : « No known vulnerabilities found », EXIT=0. **Non vérifié** : aucun run GitHub Actions déclenché depuis cet environnement (pas de push, cf. condition de fusion 1 de l'audit 3) ; démonstration gitleaks sur un secret factice non faite en CI réelle (condition de fusion 3). |
| AC-L00-11 | **Non vérifié dans cette session (démon Docker indisponible)** | `infra/docker/api.Dockerfile` écrit, relu, et le job CI `docker-api` (`build` + exécution non-root + `/health/live`, `needs: ci`) est en place depuis l'audit 1 — mais aucun `docker build` réel n'a été exécuté dans ce bac à sable à aucune passe de ce lot. Images `node:24.21.0-alpine` désormais épinglées par digest en plus du tag (L5), digests revérifiés par l'audit 3 (résolution exacte vers l'image épinglée). **À confirmer par un humain ou par la CI avant fusion** (condition de fusion 1 et 2 de l'audit 3). |
| AC-L00-12 | **OK** | `.claude/hooks/test-guards.sh` rejoué sur clone propre le 2026-09-24 (commit `a4abeb5`, R1-bis, inclut le correctif N11 fait par Opus) : **45 cas, tous « ok »**, code de sortie global 0 — corrige la valeur erronée (« 31 ») d'une version antérieure de ce rapport (constat R1-bis de l'audit 3). |
| AC-L00-13 | **Sans objet** | `bonjour.html` a été **retiré du dépôt à la demande explicite du porteur** le 2026-09-24 (voir `CLAUDE.md`, section « État du projet » : « L'ancien fichier de test `bonjour.html` a été retiré... le dépôt est entièrement dédié à ce SaaS »). Ce critère, qui portait sur la préservation de ce fichier, n'a donc plus d'objet ; il ne s'agit pas d'un échec ni d'une suppression non autorisée par l'agent. |

## Corrections audit 1

Suite au verdict `CHANGES_REQUIRED` de `docs/lots/L00-socle/audit-1.md` (rejoué sur clone propre par
`auditor-opus`), les correctifs suivants ont été appliqués sur cette branche. Chaque preuve
ci-dessous a été **rejouée le 2026-09-24** dans le cadre de cette passe (commande + extrait réel de
sortie, pas une citation de mémoire).

| Constat | Commit | Preuve (rejouée le 2026-09-24) |
|---|---|---|
| **H1** — frontières inter-apps/paquet→app inopérantes sur TS (résolveur `import-x` absent) | `f539d2d` | `pnpm test:lint-boundaries` → `tests 10`, `pass 10`, `fail 0`. Contre-épreuve manuelle : ajout de `import { NestFactory } from "@nestjs/core";` en tête de `packages/domain/src/money/money.ts` → `pnpm lint` : `1:1 error '@nestjs/core' import is restricted... no-restricted-imports` (2 erreurs), fichier restauré immédiatement après, `git status --short` vide. |
| **H2** — logs sans `correlationId`, logs Nest non JSON | `d22df13` | Build + `node dist/main.js` + `curl -sD - http://127.0.0.1:3998/health/live` : `x-correlation-id: db1070f0-...` dans la réponse ; ligne de log correspondante `{"level":30,...,"correlationId":"db1070f0-...","req":{...},"msg":"incoming request"}` (JSON valide, `correlationId` présent sur « incoming request » et « request completed »). |
| **H6** — `pnpm dev` ne démarre pas l'API | `01552f7` | `NODE_ENV=development PORT=3997 HOST=127.0.0.1 LOG_LEVEL=info pnpm --filter api dev` puis `curl -sD - http://127.0.0.1:3997/health/live` → `HTTP/1.1 200 OK` (en-têtes Helmet présents). **Nouvelle observation (hors périmètre H6, signalée pour passe B)** : à l'arrêt forcé (`kill` du wrapper puis `pkill` du process `node --watch`), le second signal a provoqué un plantage natif Node (`Assertion failed: (wrap) != nullptr` dans `FSEventWrap::GetInitialized`, `node:internal/fs/watchers`) — probablement un double-kill du même processus dans cet environnement, à vérifier avec un arrêt `SIGINT` unique (`Ctrl+C`) avant de considérer H6 totalement clos en usage interactif normal. |
| **M3** — le worker se termine immédiatement (EXIT=0 après ~118 ms) | `c4d7a41` | `pnpm test` (api) → `✓ test/worker.integration.test.ts (2 tests) 1016ms` : le process `dist/worker.js` réel reste vivant ≥ 1 s sans recevoir de signal, puis quitte code 0 sur `SIGTERM` avec le message « Worker arrêté ». |
| **M4** — `tsx` n'émet pas les métadonnées de décorateurs | `01552f7` | Même preuve que H6 : `pnpm --filter api dev` démarre `apps/api/scripts/dev.mjs` (`tsc -w` + `node --watch`, plus de `tsx`) ; `HealthController` injecte `HealthService` par type (aucun `@Inject` explicite, `apps/api/src/modules/health/health.service.ts`) et répond 200 — preuve que `emitDecoratorMetadata` est bien calculé en mode dev. |
| **M5** — le test d'intégration recâblait l'application à la main | `d22df13` | `apps/api/test/health.integration.test.ts` utilise désormais `createApp(config)` (même bootstrap que `main.ts`) ; `pnpm test` (api) → 30/30 verts, y compris les 3 assertions d'en-têtes de sécurité et le format UUID de `correlationId`. |
| **L1** — variable manquante annoncée comme « valeur invalide » | `d22df13` | `apps/api/src/config/env.schema.test.ts` : cas « variable manquante » et « valeur invalide » distingués, messages différents ; `pnpm test` (api) → tous verts (voir sortie `pnpm test` ci-dessus). |
| **L2** — `money()` acceptait des entiers non sûrs | `d22df13` | `packages/domain/src/money/money.ts:39` : `Number.isSafeInteger(amount)` ; `packages/domain/src/money/money.test.ts` → 9 tests verts (2 dédiés à la sécurité de l'entier). |
| **L7** — `correlationId` client non filtré | `d22df13` | `apps/api/src/common/correlation/correlation.ts` : motif `^[A-Za-z0-9._:-]{1,128}$` avant réutilisation, sinon régénération ; `correlation.test.ts` → 7/7 verts. |
| **H5** — gitleaks : clone superficiel, `permissions` absentes | `67805c8` | `git diff .github/workflows/ci.yml` : `fetch-depth: 0` ajouté sur `actions/checkout` ; `permissions: { contents: read }` au niveau workflow. `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"` → aucune erreur. `GITLEAKS_LICENSE` **non ajouté** (dépôt personnel, pas une organisation à ce jour) — à revoir si cela change. |
| **M6** — CI : pas de `permissions`, actions non épinglées, audit non bloquant | `67805c8` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `gitleaks/gitleaks-action`, `actions/upload-artifact` épinglées par SHA de commit (tag en commentaire) ; chaque SHA obtenu par `git ls-remote https://github.com/<owner>/<repo> refs/tags/<tag>` le 2026-09-24 (ex. `git ls-remote https://github.com/actions/checkout refs/tags/v4.4.0` → `11d5960a326750d5838078e36cf38b85af677262`). `pnpm audit --prod --audit-level=critical` sans `\|\| true`. |
| **L6** — versions dupliquées CI / `.nvmrc` / `packageManager` | `67805c8` | `env.NODE_VERSION`/`PNPM_VERSION` retirés de `ci.yml` ; `actions/setup-node` utilise `node-version-file: ".nvmrc"` ; `pnpm/action-setup` n'a plus de clé `version:` (lu depuis `packageManager` de `package.json`, comportement documenté de l'action). |
| *(ajout de portée, non listé par l'audit)* — étape CI manquante pour les frontières de lint | `67805c8` | Étape `pnpm test:lint-boundaries` ajoutée à `ci.yml` (le script existait déjà depuis `f539d2d` mais n'était pas exécuté en CI). |
| **L3** — dépendances déclarées non importées (`@eslint/eslintrc`, `@app/domain`, `@nestjs/testing`) | `d22df13` (les deux premières), `ea080e8` (la troisième) | `@eslint/eslintrc` et `@app/domain` : `git log -S'"@eslint/eslintrc"' -- package.json` / `git log -S'"@app/domain"' -- apps/api/package.json` → dernière suppression au commit `d22df13`, absentes de tous les `package.json` actuels (`grep -rn "eslintrc\|@app/domain"` : aucun résultat hors commentaire). `@nestjs/testing` : introuvable par `grep -rn "nestjs/testing" apps/api` (hors `package.json`) avant retrait ; retirée, `pnpm install` → `pnpm-lock.yaml` diff `-22` lignes (entrées `@nestjs/testing`) ; `pnpm lint`, `pnpm typecheck`, `pnpm test` (30 api + 9 domain + 3 storefront + 3 backoffice), `pnpm test:lint-boundaries` (10/10) tous verts après coup. `rxjs`, `reflect-metadata`, `@swc/core` **conservés** : peer dependencies requises par `@nestjs/common`/`unplugin-swc` (vérifié dans leurs `package.json` publiés), pas des dépendances orphelines. |
| **H7** — le rapport d'implémentation citait des preuves non réelles | *(ce commit)* | Sections « `pnpm lint` (AC-L00-02, AC-L00-08) » et « Démarrage réel de l'API buildée (AC-L00-04, AC-L00-06) » réécrites ci-dessus avec le constat réel de l'audit et des preuves rejouées le 2026-09-24 ; tableau des AC corrigé (AC-06, AC-08) ; table des dépendances corrigée (`@app/domain`, `@nestjs/testing`, `tsx`). Le commentaire trompeur de `apps/api/src/worker.ts:38` avait déjà été corrigé au commit `c4d7a41` (passe A antérieure) — vérifié : le fichier référence désormais `worker.integration.test.ts`, qui existe et passe. |
| **H3** — `api.Dockerfile` ne se construit pas après `turbo prune` (`tsconfig.base.json` absent) | `1a4d06e` (correctif), *(ce commit)* (preuve) | Preuve rejouée sans Docker le 2026-09-24 dans `sim-h3`/`sim-h3-build` (`turbo prune api --docker --out-dir sim-h3`, puis reproduction exacte des `COPY` du Dockerfile) : `pnpm install --frozen-lockfile` → `Done in 2s using pnpm v12.6.0` ; `pnpm turbo run build --filter=api...` → `api:build: $ tsc -p tsconfig.build.json` / `Tasks: 1 successful, 1 total`, `apps/api/dist/main.js` généré. Contre-épreuve négative (`sim-h3-build-neg`, `tsconfig.base.json` supprimé) : `error TS5083: Cannot read file '.../tsconfig.base.json'` reproduit à l'identique de l'audit, confirmant que le `COPY` est bien la cause et le correctif suffisant (seul `apps/api` est dans le sous-graphe, aucun autre `packages/*/tsconfig*.json` requis via `extends`). Job CI `docker-api` (`ci.yml:79-137`) ajouté par `1a4d06e`, complété (ce commit) par `needs: ci` pour ne construire l'image qu'après le job principal vert ; `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` sans erreur. **Docker build réel (le `docker build`/`docker run` du job `docker-api`) reste à vérifier en CI** — le démon Docker n'est pas exploitable dans ce bac à sable (cf. AC-L00-03/H4). |
| **L5** — `.dockerignore` sans `.env*` | `(ce commit)` | `.dockerignore` complété : `.env`, `.env.*`, `**/.env`, `**/.env.*`. Vérifié qu'aucun code de build/runtime ne lit `.env.example` (`grep -rn "\.env\.example"` hors `node_modules` : uniquement de la documentation et des scripts de garde-fous) — exclu aussi, sans exception. **Docker build réel à vérifier en CI** (job `docker-api`) pour confirmer que l'image se construit toujours correctement une fois `.env*` exclu du contexte. Les deux autres sous-points de L5 (images épinglées par tag et non par digest, patch postgres ancien) restent **hors périmètre de cette passe** — voir « Reste ouvert ». |
| **M7** — image runtime Docker non minimale, arrêt non propre | `7e337ec` | `infra/docker/api.Dockerfile` : nouveau stage `deployer` (`pnpm --filter api deploy --prod --frozen-lockfile /repo/deploy`) puis nettoyage (`src`, `test`, `scripts`, `tsconfig*`, `.turbo`) ; stage `runtime` reconstruit depuis `node:24.21.0-alpine` propre (plus de pnpm/corepack/sources du monorepo), `COPY` **sans** `--chown` (racine reste propriétaire) puis `USER app`. Preuve par simulation hors Docker (démon bloqué), scratchpad `sim-m7` : `turbo prune api --docker` → `pnpm install --frozen-lockfile` (260 Mo, stage « installer ») → `pnpm turbo run build --filter=api...` → `pnpm --filter api deploy --prod --frozen-lockfile ../deploy-out2` (`reused 79, downloaded 0` : aucun accès réseau, store pnpm local réutilisé) → 40 Mo après déploiement, **aucun** `typescript`/`vitest`/`eslint`/`@playwright` dans `node_modules/.pnpm` du résultat (`ls node_modules/.pnpm \| grep -Ei "^(typescript\|vitest\|eslint\|@playwright)"` → vide). Copié dans `/opt/m7-sim` (permissions normales, contrairement au scratchpad en 700) : `su -s /bin/sh nobody -c "touch newfile.txt"` → `Permission denied` (fichiers non modifiables par un utilisateur non-root) ; `su -s /bin/sh nobody -c "node dist/main.js"` (uid 65534 confirmé par `ps -o uid`) → `curl /health/live` → `200 {"status":"ok"}`. `apps/api/src/app.ts` : `app.enableShutdownHooks(undefined, { useProcessExit: true })` (sans ce réglage, Nest se ré-envoie le signal reçu après nettoyage et le process sort avec code 143, pas 0 — constaté avant correctif) ; `apps/api/test/main-shutdown.integration.test.ts` (nouveau) exécute `dist/main.js` réel : `pnpm --filter api test` → 8 fichiers, 32 tests verts, dont ce nouveau test (SIGTERM → code 0, aucun signal, < 2 s — mesuré manuellement à 9-17 ms). |
| **M1** — CSP des apps Next bloque les scripts inline de Next | `8b8da28` | `apps/{storefront,backoffice}/src/proxy.ts` (nouveau, remplace `middleware.ts` — convention dépréciée depuis Next 16, vérifiée dans `node_modules/next/dist/docs/.../proxy.md` embarquée par le paquet installé, avertissement de build reproduit avant correctif : « The "middleware" file convention is deprecated. Please use "proxy" instead. ») : CSP à nonce + `strict-dynamic`, posée sur la requête et la réponse ; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` conservés. `src/app/[locale]/layout.tsx` (les deux apps) : `await connection()` force le rendu dynamique par requête (requis par la doc Next 16 pour que le nonce soit injecté — sans cela, `● (SSG)` reste prégénéré au build sans nonce disponible ; confirmé par le changement de statut de route dans la sortie de build, `● (Static)` → `ƒ (Dynamic)`). Preuve par `curl` sur `next start` réel : l'en-tête `content-security-policy` contient `'nonce-<valeur>'`, et le même `nonce="<valeur>"` apparaît dans le HTML servi. `e2e/tests/security-headers.spec.ts` (nouveau) : `page.on('console')`/`pageerror` réels sur `/fr` et `/en` des deux apps → `pnpm test:e2e` : **9/9 verts** (deux exécutions consécutives), 0 erreur CSP/JS, en-têtes de sécurité vérifiés, nonce du HTML confirmé identique à celui de l'en-tête. Effet de bord corrigé au passage : `apps/{storefront,backoffice}/public/favicon.ico` (fichier ICO minimal valide, absent jusqu'ici) — sans lui, chaque page déclenchait un vrai 404 loggé en erreur console, bruitant ce nouveau test. |
| **L4** — `X-Powered-By`, titres codés en dur, `lang` non testé côté backoffice | `e20999a` | `next.config.ts` (les deux apps) : `poweredByHeader: false` — vérifié par `curl -sD - http://127.0.0.1:3199/fr` sur `next start` réel : aucune ligne `x-powered-by` dans les en-têtes (avant correctif : `X-Powered-By: Next.js` présent). `src/app/[locale]/layout.tsx` : `generateMetadata` + `getDictionary(locale).title` remplace le `metadata` statique codé en dur (`metadata` ne peut pas dépendre de `params`, d'où le passage à la forme dynamique). `e2e/tests/pages.spec.ts` : ajoute `toHaveAttribute("lang", ...)` pour le back-office (absent jusqu'ici, seul le storefront l'avait) et `toHaveTitle(...)` pour les quatre pages (FR/EN × storefront/backoffice) — `pnpm test:e2e` : 9/9 verts. |
| **M2** — couverture lint Next insuffisante, règles typées non activées | `6e6d12b` | `eslint.config.mjs` : `@next/eslint-plugin-next`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` utilisés **directement** (config native flat vérifiée dans `node_modules/eslint-config-next/dist/index.js` : `module.exports = [...]`, sans `@eslint/eslintrc`/FlatCompat) plutôt que le paquet agrégé `eslint-config-next` (qui embarque `eslint-plugin-import` et son propre résolveur, en conflit avec `eslint-plugin-import-x` déjà utilisé pour H1 — approche explicitement recommandée par la doc Next 16 dans ce cas, section « Migrating existing config → Using the plugin directly »). Scope strict `apps/storefront/**/*.{ts,tsx}` + `apps/backoffice/**/*.{ts,tsx}` (vérifié : `pnpm lint` sans avertissement `no-html-link-for-pages` une fois `settings.next.rootDir` ajouté par app). `@typescript-eslint/no-floating-promises`/`no-misused-promises` passées à `"error"` sur `**/*.{ts,tsx}` (project service). Fixtures `apps/storefront/src/__lint-fixtures-typed__/{img-element.tsx,floating-promise.ts}` (fichiers TypeScript valides, contrairement aux fixtures H1/M8 — restent dans le graphe type-aware normal). Preuve : `pnpm test:lint-boundaries` → **15/15 verts** (dont les 2 nouveaux cas : `@next/next/no-img-element` severity 1, `@typescript-eslint/no-floating-promises` severity 2) ; `pnpm lint` EXIT=0 sans avertissement ; `pnpm typecheck`/`build`/`test` 10/10 verts ; aucune violation trouvée dans le code applicatif réel (aucun `<img>`, aucune promesse flottante). |
| **M8** — risques structurels pour L01 (ESM des paquets, liste d'autorisation domain) | `a07c84a` | `packages/{config,contracts,db,domain,i18n,testing,ui}/package.json` : `"type": "module"` + `exports` (`types` en premier). Sortie `dist/` vérifiée réellement ESM après rebuild (`cat packages/config/dist/index.js` → `export {};`, plus de wrapper `"use strict"; Object.defineProperty(exports, ...)`). `packages/domain/src/{index.ts,money/money.test.ts}` : imports relatifs avec extension `.js` explicite (requis par `module: "node16"` en mode ESM strict, même convention qu'`apps/api`). **Interopérabilité réelle prouvée** (non committée) : (1) symlink `apps/api/node_modules/@app/domain` → `packages/domain` (simulation d'un lien pnpm), `node --input-type=module -e "import('@app/domain')..."` depuis `apps/api` → résolu, `add(10.00 CHF, 2.50 CHF) = 1250 CHF`. (2) même symlink côté `apps/storefront`, import temporaire dans `page.tsx`, `pnpm --filter storefront build` (Turbopack) → sortie de build réelle : `M8 verification: 1250 CHF` pendant le prerender — aucune incompatibilité ESM/bundler Next. Les deux symlinks et le fichier temporaire ont été retirés après vérification (`git status --short` propre). `eslint.config.mjs` : ajoute `postgres`/`postgres/*` aux motifs interdits (manquant ; `ioredis`/`stripe` déjà présents mais sans fixture) ; `packages/domain/src/__lint-fixtures__/imports-{postgres,ioredis,stripe}.ts` (nouveau) + 3 cas dans `tools/eslint-boundaries.test.mjs` → **15/15 verts** (les six motifs du constat ont chacun une fixture testée). `packages/domain/package.json` toujours sans `dependencies`. |

### Reste ouvert après la passe B2 (audit 1) — **périmé, voir « Corrections audit 2 » ci-dessous**

Cette sous-section listait, à l'issue de la passe B2 (audit 1), les points suivants : H4 (image
MinIO introuvable), L5 (digests), le plantage natif de `node --watch` en mode dev, le build Docker
réel jamais exécuté, et l'avertissement Vitest/Vite ESM-dans-CommonJS. **Tous ces points ont été
repris et traités par l'audit 2** (`docs/lots/L00-socle/audit-2.md`) sous les identifiants H4, L5,
N6, N10 (build Docker réel : toujours non exécuté, voir « Reste à confirmer par la CI ou un
humain » ci-dessous) — voir le détail commit → preuve dans « Corrections audit 2 ». Cette
sous-section est conservée uniquement pour l'historique et ne doit plus être lue comme une liste
d'écarts actuels.

## Corrections audit 2

Suite au verdict `CHANGES_REQUIRED` de `docs/lots/L00-socle/audit-2.md` (contre-audit rejoué sur
clone propre par `auditor-opus`), les correctifs suivants ont été appliqués sur cette branche.
Chaque preuve ci-dessous a été **rejouée réellement sur un clone propre le 2026-09-24**
(`git clone /home/user/app-test <scratchpad>/r1-clone`, Node 24.21.0, pnpm 12.6.0), sauf mention
contraire explicite.

| Constat | Commit | Preuve (rejouée le 2026-09-24 sur clone propre) |
|---|---|---|
| **N1 (HIGH)** — `turbo.json` surchargeait la clé `apps/api#test` (paquet nommé `api`), ignorée : `pnpm test` échouait sur clone propre avant tout build (`dist/` absent) | `56b91f6` | Clé corrigée en `api#test` avec `dependsOn: ["^build", "build"]`. `pnpm install --frozen-lockfile && pnpm test` sur clone propre, **sans build préalable** : `Tasks: 11 successful, 11 total` ; `api:test` → `Test Files 8 passed (8)`, `Tests 33 passed (33)`. |
| **H4 (HIGH)** — `localstack/localstack:2026.08.4` était en réalité l'image LocalStack **Pro** (dépôt communautaire archivé, compte requis) | `56b91f6` | Remplacée par `chrislusf/seaweedfs:4.47` (Apache-2.0, sans compte), sur arbitrage du fil principal (voir `audit-2.md`). Tag, digest, commande (`mini -dir=/data`) et présence du binaire `curl` pour le healthcheck vérifiés via l'API du registre Docker et le Dockerfile source amont, documentés dans `docs/architecture/self-hosting.md`. `docker compose -f infra/docker/compose.yaml config` → EXIT=0 (démon Docker toujours indisponible pour `up`, voir « Reste à confirmer »). |
| **M1 (MEDIUM, partiel)** — pages 404 prérendues sans nonce CSP (14 erreurs console/CSP) | `56b91f6` | `app/global-not-found.tsx` (`experimental.globalNotFound`) et `app/not-found.tsx`, rendus dynamiquement (`connection()`). `e2e/tests/not-found.spec.ts` : `/fr/inexistant` et `/xx`, les deux apps → 4 tests. `pnpm test:e2e` sur clone propre : **13/13 verts** (voir « Commandes exécutées » ci-dessus), 0 erreur console/CSP. |
| **N4 (MEDIUM)** — logs de requête contenant la query string, l'IP et le host, sans liste d'autorisation | `e888cea` | `apps/api/src/app.ts` : sérialiseur `req` explicite (`{ method, url: url.split("?")[0] }`), ni `host` ni `remoteAddress`/`remotePort`. `apps/api/test/logging.integration.test.ts` (nouveau) vérifie qu'un `?token=secret` n'apparaît dans aucun log. `pnpm test` (api, clone propre) : 33/33 verts, y compris ce test. |
| **N5 (MEDIUM)** — `gitleaks-action` ne scanne que les 30 premiers commits d'une PR (API GitHub non paginée) | `e888cea` | `.github/workflows/ci.yml` : CLI `gitleaks` v8.30.1 téléchargée et vérifiée par somme SHA-256 (`gitleaks_8.30.1_checksums.txt` de la release officielle), exécutée avec `gitleaks detect --source . --redact` sur l'historique complet (`actions/checkout` avec `fetch-depth: 0`), au lieu de l'action tierce. YAML validé. **Non rejoué en CI réelle** (pas de push) — voir « Reste à confirmer ». |
| **N6 (LOW)** — `node --watch` provoquait une assertion native (`FSEventWrap::GetInitialized`) à l'arrêt en mode `pnpm dev` | `e888cea` | `apps/api/scripts/dev.mjs` réécrit : abandon de `node --watch`, remplacé par `fs.watch(dist/, { recursive: true })` géré par le script lui-même (spawn/kill classiques du process applicatif, jamais de mode `--watch` natif). Non rejoué manuellement dans cette passe (hors de la liste des commandes R1) — comportement inchangé depuis le commit, `pnpm typecheck`/`lint`/`test` restent verts. |
| **N7 (LOW)** — la liste deny des `.env` procédait par énumération (`.env.dev`, `.env.backup`… non couverts) | `fba8082` | `.claude/hooks/guard-bash.sh` : motif générique bloquant toute variante `.env.*` sauf `.env.example`/`.env.sample`/`.env.template` (au lieu d'une énumération de suffixes). `.claude/hooks/test-guards.sh` rejoué sur clone propre : 31/31 cas « ok », code de sortie global 0. **Historique — insuffisant** : l'audit 3 a montré que ce correctif laissait passer d'autres variantes (régression **N11**, voir « Corrections audit 3 »), corrigées depuis par le fil principal Opus. La valeur actuelle est 45/45 (voir « Commandes exécutées »). |
| **N8 (LOW)** — `npx --yes turbo@2.11.3` dans le Dockerfile, hors lockfile | `e888cea` | `infra/docker/api.Dockerfile`, stage `pruner` : `RUN pnpm install --frozen-lockfile` puis `RUN pnpm exec turbo prune api --docker` (binaire `turbo` déjà verrouillé par `pnpm-lock.yaml`, aucun accès au registre npm hors lockfile). Non rejoué par un `docker build` réel dans cette passe (démon indisponible, voir « Reste à confirmer ») ; syntaxe du Dockerfile relue. |
| **N9 (LOW)** — `createRequire`/`node:module` et le type `import("...")` (`TSImportType`) non interdits dans `packages/domain`, contournant la liste d'autorisation M8 | `b0a7db9` | `eslint.config.mjs` : nouveau motif `no-restricted-imports` sur `["node:module", "module"]` et nouveau sélecteur `no-restricted-syntax` sur `TSImportType`. Fixtures `packages/domain/src/__lint-fixtures__/{imports-node-module.ts,type-import.ts}` + 2 cas dans `tools/eslint-boundaries.test.mjs`. `pnpm test:lint-boundaries` sur clone propre : **17/17 verts**. |
| **N10 (LOW)** — avertissement Vite « ESM syntax in a file loaded as CommonJS » sur `apps/{storefront,backoffice}/vitest.config.ts` | `b0a7db9` | Cause identifiée : ces deux apps n'ont pas `"type": "module"` dans leur `package.json` (contrairement à tous les `packages/*`), donc `vitest.config.ts` y est chargé comme CommonJS par défaut. `vitest.config.ts` renommé en `vitest.config.mts` dans les deux apps (Vitest le détecte automatiquement, aucun script à modifier). `pnpm --filter storefront test` et `pnpm --filter backoffice test` sur clone propre : 3/3 verts chacun, **aucun avertissement** dans la sortie. |
| **L5** — images Docker épinglées par tag mais pas par digest (`postgres`, `redis`, `mailpit`, `node`) | `b0a7db9` | Digests obtenus **réellement** via l'API Docker Hub (`GET /v2/repositories/<ns>/tags/<tag>`, champ `digest`, interrogée le 2026-09-24) : `postgres:16.15-alpine`, `redis:7.4-alpine`, `axllent/mailpit:v1.20.7`, `node:24.21.0-alpine` (base et runtime du Dockerfile `api`) — tag conservé dans chaque cas, digest ajouté après `@sha256:...`. `chrislusf/seaweedfs:4.47` était déjà épinglé par digest depuis `56b91f6` (H4). `docker compose -f infra/docker/compose.yaml config` → EXIT=0. |
| **R1 (MEDIUM, ex-H7)** — rapport d'implémentation contradictoire (H4, AC-11, écart 6, AC-13, nombre de tests) | `15309bb` | Cette mise à jour du rapport : tableau des AC corrigé (AC-03, AC-10, AC-11 reformulés sans mention de LocalStack/MinIO périmée ; AC-13 « sans objet », `bonjour.html` retiré à la demande du porteur) ; section « Corrections audit 2 » (ce tableau) ; section « Reste à confirmer par la CI ou un humain » (ci-dessous) ; nombres de tests mis à jour partout où ils étaient cités (33 api, 9 domain, 3+3 storefront/backoffice, 13 e2e, 17 lint-boundaries, 31 test-guards) ; écart 6 (« CI ne construit pas l'image Docker ») retiré car périmé (le job `docker-api` existe depuis l'audit 1, `1a4d06e`/`6f1d6ec`). **Historique — incomplet** : l'audit 3 a constaté que ce commit rejouait la plupart des chiffres mais en recopiait d'autres sans les rejouer réellement (typecheck « 11 », build `○ /_not-found`, logs avec `host`/`remoteAddress`, contradiction `--frozen-lockfile`) — voir « Corrections audit 3 » ci-dessous pour le correctif complet (R1-bis). |

## Corrections audit 3

Suite au verdict `CHANGES_REQUIRED` de `docs/lots/L00-socle/audit-3.md` (contre-audit rejoué sur
clone propre par `auditor-opus`), 0 BLOCKER, 0 HIGH, 2 MEDIUM ciblés :

| Constat | Qui / Commit | Détail |
|---|---|---|
| **N11 (MEDIUM)** — régression du garde-fou `.env` (`fba8082`) : `cat .env\|head`, `cat .env;echo`, `cat <.env`, `.env.production.local`, `.env.development.local`, `.env.local.bak`, `.env.example.local`, `.env.sample.bak` non bloqués | **Fil principal Opus** (`.claude/`, hors périmètre de cet agent), commit `3e491eb` | Suffixes multiples, terminateurs `\| ; & < > )`, redirection `<.env`, liste d'autorisation limitée aux modèles terminaux exacts. `.claude/hooks/test-guards.sh` rejoué par cet agent sur clone propre pour R1-bis : **45/45 « ok »**, code de sortie global 0 (voir « Commandes exécutées »). Cet agent n'a pas modifié `.claude/hooks/guard-bash.sh` et ne revendique pas ce correctif. |
| **L-a (LOW)** — le reporter HTML Playwright n'était pas configuré, artefact CI `playwright-report/` vide | Cet agent, commit `a4abeb5` | `e2e/playwright.config.ts` : ajout de `["html", { open: "never", outputFolder: path.join(ROOT_DIR, "playwright-report") }]` à côté de `["list"]`. Chemin **absolu** vers la racine du dépôt utilisé délibérément : Playwright résout `outputFolder` relativement au dossier du fichier de config (`e2e/`), pas au répertoire d'exécution — un chemin relatif aurait produit `e2e/playwright-report`, incohérent avec l'artefact CI (`ci.yml`, `path: playwright-report/`, à la racine). Vérifié sur clone propre : `playwright-report/index.html` présent à la racine après `pnpm test:e2e` (voir « Commandes exécutées »). |
| **L-b (LOW)** — commentaire inexact dans `[locale]/layout.tsx` (référence à un fichier `[locale]/not-found.tsx` inexistant côté storefront) ; titre 404 anglais seul (« Not found ») pour un segment `[locale]` non supporté (ex. `/xx`) | Cet agent, commit `a4abeb5` | Commentaire du storefront réécrit pour référencer `app/not-found.tsx` (le fichier qui s'applique réellement, comme déjà documenté côté backoffice). `generateMetadata` des deux apps renvoie désormais `{ title: "404 — Page introuvable / Page not found" }` (même libellé que `app/global-not-found.tsx`) au lieu de `{ title: "Not found" }`. Assertion ajoutée dans `e2e/tests/not-found.spec.ts` : `await expect(page).toHaveTitle(...)` pour `/fr/inexistant` et `/xx`, dans les deux apps. `pnpm test:e2e` rejoué sur clone propre : 13/13 verts, y compris ces 4 assertions de titre. |
| **R1-bis (MEDIUM)** — rapport d'implémentation citant des chiffres faux ou périmés présentés comme actuels (« 31 cas », typecheck « 11 », `○ /_not-found`, logs avec `host`/`remoteAddress`, contradiction `--frozen-lockfile`, lignes de `ci.yml` non revérifiées) | Cet agent, *(ce commit)* | Ce document : section « Commandes exécutées et résultats réels » entièrement rejouée sur un **clone propre distinct** (`git clone /home/user/app-test <scratchpad>/r1bis`, `git checkout a4abeb5`), avec extraits réels pour `pnpm install --frozen-lockfile`, `pnpm test` (sans build), `pnpm format:check`, `pnpm lint`, `pnpm typecheck` (10/10, pas 11), `pnpm test:lint-boundaries` (17/17), `pnpm build` (10/10, routes `ƒ` dynamiques, pas `○`), `pnpm test:e2e` (13/13 + `playwright-report/index.html` confirmé), `.claude/hooks/test-guards.sh` (45/45, pas 31), `pnpm audit --prod --audit-level=critical` (aucune vulnérabilité), démarrage réel de l'API buildée avec `curl '/health/live?token=x'` et extrait de log montrant `req:{method,url}` sans query ni host ni IP. Tout extrait antérieur conservé pour l'historique est explicitement marqué comme tel. Le clone `r1bis` a été supprimé après vérification. Les lignes précises de `ci.yml` citées dans « Corrections audit 1 » (H3, H5) n'ont pas été revérifiées dans cette passe (hors périmètre des commandes listées par l'audit 3 pour R1-bis) — signalé ici plutôt que corrigé silencieusement ; se fier au contenu du fichier, pas aux numéros de ligne cités dans l'historique. |

## Tests non exécutés et raison

- **`pnpm test:int`, `pnpm test:tenancy`** : n'existent pas encore — explicitement prévus au lot L01
  par la spec (§ Commandes de `CLAUDE.md` et §2 de la spec L00 : « documentés comme introduits au
  L01 »). Aucune omission.
- **Démonstration gitleaks sur secret factice (AC-L00-10)** : non exécutée, nécessite un push
  déclenchant réellement le workflow GitHub Actions — voir « Reste à confirmer par la CI ou un
  humain » ci-dessous.
- **Build et exécution réelle de l'image Docker `api` (AC-L00-11) et `docker compose up -d --wait`
  (AC-L00-03)** : le démon Docker n'est pas exploitable dans ce bac à sable (confirmé de nouveau
  dans cette passe : `docker info` échoue). Ni contournés, ni simulés au-delà de
  `docker compose config` (validation syntaxique uniquement, EXIT=0) et `pnpm exec` normal — voir
  « Reste à confirmer par la CI ou un humain » ci-dessous.
- **`cp .env.example .env && pnpm dev`** : **non exécuté délibérément par cet agent**, y compris
  dans la passe R1-bis — `docs/lots/L00-socle/audit-3.md` (« Conditions de fusion », point 4) exige
  explicitement que cette commande soit lancée **par un humain** ; par ailleurs
  `.claude/hooks/guard-bash.sh` bloque toute commande créant/copiant un fichier `.env` réel (motif
  générique `.env.*`, hors modèles), ce qui est cohérent avec cette exigence. Le démarrage de l'API
  buildée pour R1-bis (`curl '/health/live?token=x'`) a été fait **sans fichier `.env`**, via des
  variables d'environnement passées directement au process (`NODE_ENV=... node dist/main.js`), pour
  ne contourner ni la règle de garde-fou ni l'exigence de validation humaine — voir « Reste à
  confirmer par la CI ou un humain ».

## Reste à confirmer par la CI ou un humain avant fusion

Ces points ne peuvent pas être vérifiés dans le bac à sable de cet agent (pas de démon Docker, pas
de déclenchement réel de GitHub Actions, pas de session interactive humaine). Ils correspondent aux
5 « conditions de fusion » listées par `docs/lots/L00-socle/audit-3.md` :

1. **`docker build`** réel de `infra/docker/api.Dockerfile` (job CI `docker-api`, `needs: ci`) :
   construction effective de l'image, exécution non-root (`uid != 0`), réponse `/health/live`.
2. **`docker compose -f infra/docker/compose.yaml up -d --wait`** : les 4 services (PostgreSQL,
   Redis, Mailpit, SeaweedFS/S3) doivent atteindre l'état `healthy` — la syntaxe est validée
   (`docker compose config` → EXIT=0) mais l'exécution réelle des healthchecks (notamment le
   healthcheck SeaweedFS sur `curl http://127.0.0.1:9333/healthz`, jamais testé en conditions
   réelles) ne l'est pas.
3. **Premier run CI réel** (`.github/workflows/ci.yml`) sur GitHub Actions : aucun push n'a été fait
   depuis cet environnement ; le YAML est validé syntaxiquement mais jamais exécuté par le runner
   réel.
4. **Démonstration gitleaks** (AC-L00-10) : injecter un secret factice dans une branche/PR de test
   et vérifier que la CLI `gitleaks` v8.30.1 (commit `e888cea`) le détecte et fait échouer le job.
5. **`cp .env.example .env && pnpm dev`** exécuté par un humain (ou un agent disposant d'un accès
   interactif prolongé) : démarrage des trois apps (`api`, `storefront`, `backoffice`) en mode
   développement local, vérification visuelle/manuelle qu'elles répondent correctement ensemble.
6. **Protection de la branche `main`** : à activer par un humain avec les droits d'administration du
   dépôt (hors de portée de tout agent).

## Écarts par rapport à la spec

1. **TypeScript 6.0.3 au lieu de 7.0.2** (incompatibilité avérée avec `typescript-eslint`, voir
   « Choix techniques »). Conforme à la clause de repli explicite de la spec §8 ; strict mode
   préservé intégralement.
2. **`apps/api` en ESM (`"type": "module"`)**, non anticipé par la spec, imposé par NestJS 12.1.0
   étant distribué en ESM pur dans ce relevé de registre. Impact : imports relatifs avec extension
   `.js`, pas de `require()`. Aucun impact sur le contrat public ni sur les dépendances (mêmes
   paquets, mêmes versions).
3. **`.env.example` non créé.** Une règle de permission de cet environnement
   (`permissions.deny: "Read(./.env.*)"` dans `.claude/settings.json`) bloque toute création de
   fichier correspondant au motif `.env.*`, y compris `.env.example` — alors même que
   `.claude/hooks/test-guards.sh` teste explicitement que `.env.example` doit être autorisé
   (`file_ok "/repo/.env.example"`). Il y a donc une **incohérence entre le motif de permission
   (trop large) et l'intention documentée par les tests de garde-fous**. Je n'ai pas modifié
   `.claude/settings.json` (hors périmètre, et modifier une règle de sécurité n'est pas de mon
   ressort). Le contenu prévu pour `.env.example` est documenté dans `README.md` (section
   « Variables d'environnement ») et reproduit ci-dessous pour qu'un humain (ou un agent disposant
   des permissions ad hoc) puisse créer le fichier en une commande :
   ```
   NODE_ENV=development
   PORT=3000
   HOST=0.0.0.0
   LOG_LEVEL=info
   ```
   **Résolu depuis** (commit `9020ee5`, hors périmètre audité par `audit-1.md` — cf. note I2) : la
   règle `deny` a été remplacée par une liste explicite de fichiers de secrets, et `.env.example` a
   été créé. Écart conservé ici pour l'historique ; il ne reflète plus l'état actuel du dépôt.
4. **Intégration `eslint-config-next` retirée (état initial, corrigé — voir M2, commit `6e6d12b`).**
   `compat.extends("next/core-web-vitals")` (via `@eslint/eslintrc`) provoquait une erreur
   `TypeError: Converting circular structure to JSON` avec ESLint 10.11.0 + `eslint-config-next`
   16.3.6 dans cet environnement. **Résolu depuis** : plutôt que de forcer le paquet agrégé
   `eslint-config-next` via la couche de compatibilité legacy, les plugins qu'il embarque
   (`@next/eslint-plugin-next`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`) sont utilisés
   directement en flat config natif, scopés à `apps/storefront`/`apps/backoffice` — approche
   explicitement recommandée par la doc Next 16 pour éviter le conflit avec `eslint-plugin-import-x`
   déjà en place (H1). Voir « Corrections audit 1 », entrée M2, pour le détail et les preuves.
5. **`webServer` Playwright et `test:e2e`** : voir le détail dans « Commandes exécutées ». Le script
   `test:e2e` fait désormais `turbo run build --filter=storefront --filter=backoffice && playwright
   test ...` plutôt que de laisser Playwright construire les apps lui-même. Ajout des redirections
   `/` → `/fr` dans les deux apps Next (non prévu explicitement par la spec, mais cohérent avec
   « site public » et nécessaire pour fiabiliser `webServer.url`).
6. ~~`.github/workflows/ci.yml` ne construit pas encore l'image Docker `api`~~ **Périmé, corrigé
   depuis (audit 1, commits `1a4d06e`/`6f1d6ec`)** : le job `docker-api` (`ci.yml:99-140`) construit
   réellement l'image, vérifie l'exécution non-root et `/health/live`, et ne s'exécute qu'après le
   job `ci` (`needs: ci`). Reste non vérifié : l'exécution réelle de ce job sur un runner GitHub
   Actions (aucun push depuis cet environnement) — voir « Reste à confirmer par la CI ou un
   humain ». Écart conservé ici uniquement pour l'historique.
7. **Node 24.21.0 non natif à cet environnement de développement** (voir « Choix techniques ») :
   toutes les commandes de vérification ont explicitement forcé ce PATH ; un développeur clonant le
   dépôt sur une machine avec `nvm`/Volta obtiendra automatiquement la bonne version via `.nvmrc`,
   mais ce n'est pas garanti sur une machine sans gestionnaire de version Node.
8. **Reformatage accidentel puis annulé** de `bonjour.html`, `docs/**` et `.claude/agents/*.md` par
   un premier `pnpm format` lancé sans périmètre restreint. Détecté avant tout commit via
   `git diff --cached --stat`, annulé par `git restore`, et prévenu pour l'avenir en excluant ces
   chemins de `.prettierignore`. Aucun de ces fichiers n'apparaît dans les commits de ce lot.

## Questions ouvertes

1. ~~Le porteur souhaite-t-il assouplir la règle `permissions.deny` sur `.env.*` pour permettre la
   création de `.env.example` par un agent (voir écart 3) ?~~ **Devenue obsolète** : résolue depuis
   le commit `9020ee5` (règle `deny` remplacée par une liste explicite de fichiers de secrets,
   `.env.example` créé et présent dans le dépôt — vérifié : `ls .env.example` et
   `.claude/hooks/test-guards.sh` `file_ok "/repo/.env.example"` passent tous les deux). Question
   sans objet désormais.
2. ~~Faut-il réintégrer les règles ESLint spécifiques à Next.js (a11y, react-hooks, web-vitals) dans
   ce lot ou les reporter à un lot frontend dédié (écart 4) ?~~ **Résolue** : intégrées au lot L00
   lui-même (constat M2, commit `6e6d12b`), scopées aux deux apps Next, sans les règles Core Web
   Vitals renforcées (non demandées par un AC-L00).
3. Confirmation souhaitée du porteur : la CI GitHub Actions n'a pas été déclenchée dans cette
   session (pas de push) — la première exécution réelle (format, lint, typecheck, tests, build,
   e2e, gitleaks) doit être surveillée à la première PR pour lever les incertitudes listées
   ci-dessus (AC-L00-01 frozen-lockfile, AC-L00-10 gitleaks).
4. AC-L00-03/AC-L00-11 (Docker) nécessitent une vérification humaine ou par CI (GitHub Actions a un
   démon Docker natif, contrairement à ce bac à sable) avant la fusion.

## Heures (à compléter par le porteur)

Non renseigné dans cette session (agent).
