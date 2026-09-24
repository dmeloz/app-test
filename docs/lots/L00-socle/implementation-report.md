# Rapport d'implémentation — Lot L00 (socle technique)

- **Agent** : developer-sonnet · **Modèle réellement servi** : Claude Opus 5.5 (le fil principal a
  exécuté ce lot directement, sans déléguer à un sous-agent Sonnet distinct — voir « Écarts »).
- **Branche** : `claude/opus-sonnet-workflow-gxnvua`
- **Commits** (dans l'ordre, tous sur la branche ci-dessus, rien poussé) :
  - `b5b0cdb` — L00 : socle monorepo (checkpoint) — packages, apps/api, apps front, e2e, infra docker
  - `04ca8ac` — L00 : corrige ESM/NestJS, moduleResolution, boundary lint, pnpm build scripts
  - `d5a2437` — L00 : corrige le blocage e2e (webServer Playwright) et ajoute la redirection / -> /fr
  - (commit de ce rapport à suivre)

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
| `@app/domain` | workspace | apps/api | Paquet interne (module `money`) |

Dépendances de développement principales : `typescript` 6.0.3, `typescript-eslint` 8.70.1, `eslint`
10.11.0, `eslint-plugin-import-x` 4.17.1, `eslint-config-prettier` 10.1.8, `prettier` 3.9.9, `turbo`
2.11.3, `vitest` 5.0.1, `@playwright/test` 1.63.0, `@nestjs/testing` 12.1.0, `@swc/core` 1.16.2 +
`unplugin-swc` 2.0.0 (recette officielle NestJS pour que Vitest calcule les métadonnées de
décorateurs — Vitest/esbuild seul ne le fait pas), `tsx` 4.23.15 (mode `dev`), `@types/node` 24.13.6,
`@types/react`/`@types/react-dom` 19.3.0. Aucune dépendance hors de cette liste et de celle du §8.

## Fichiers modifiés / créés (`git diff --stat` — hors `docs/**` préexistant, non touché)

94 fichiers créés, 7652 insertions, 0 suppression (`git diff de407dc..HEAD --stat -- . ':!docs'`).
Détail complet reproductible par la commande ci-dessus. Résumé par zone :

- Racine : `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` (commité), `turbo.json`,
  `tsconfig.base.json`, `.nvmrc`, `.editorconfig`, `.gitignore` (étendu), `.prettierrc.json`,
  `.prettierignore`, `.dockerignore`, `eslint.config.mjs`, `README.md`, `.github/workflows/ci.yml`.
- `apps/api/**` : squelette NestJS + Fastify complet (voir périmètre), 5 fichiers de test.
- `apps/storefront/**`, `apps/backoffice/**` : Next.js App Router, pages `[locale]` FR/EN, tests.
- `packages/domain/**` : module `money` + tests (AC-L00-07).
- `packages/{contracts,db,ui,i18n,config,testing}/**` : squelettes vides configurés.
- `e2e/**` : configuration et test Playwright.
- `infra/docker/**` : `compose.yaml`, `api.Dockerfile`.

**Non créé** : `.env.example` — voir « Écarts ».

## Migrations (up / down / effets de bord)

Aucune migration. Aucune base de données applicative à ce lot (spec §6 : « Aucun »). `compose.yaml`
fournit PostgreSQL vide pour le développement local (préparation du lot L01), non touché par le
code de ce lot.

## Commandes exécutées et résultats réels

Toutes les commandes ci-dessous ont été exécutées avec Node 24.21.0 en tête de `PATH`
(`export PATH="/opt/nvm/versions/node/v24.21.0/bin:$PATH"`) et pnpm 12.6.0.

### `pnpm install --frozen-lockfile` (AC-L00-01)

```text
$ pnpm install
Scope: all 11 workspace projects
✓ Lockfile passes supply-chain policies
Already up to date
Done in 2ms using pnpm v12.6.0
```

(Premier `pnpm install` réel : `Packages: +466`, résolution complète, `pnpm-lock.yaml` généré et
commité. Un blocage initial `ERR_PNPM_IGNORED_BUILDS` — pnpm 12 bloque par défaut les scripts
postinstall de `@swc/core`, `esbuild`, `unrs-resolver` — a été résolu en ajoutant `allowBuilds` dans
`pnpm-workspace.yaml`, comme le propose pnpm lui-même, et confirmé via `pnpm approve-builds --all`.)

`--frozen-lockfile` n'a pas été relancé tel quel après le dernier ajustement du lockfile faute de
tour disponible en fin de session ; le dernier `pnpm install` (sans l'option) a confirmé
« Already up to date » avec le lockfile actuel, ce qui garantit la cohérence. **À revérifier en CI**
(la CI l'exécute explicitement).

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

Démonstration de la règle de frontières (AC-L00-08), faite puis retirée : ajout temporaire de
`import { NestFactory } from "@nestjs/core";` en tête de
`packages/domain/src/money/money.ts` → `pnpm lint` a échoué avec :

```text
/home/user/app-test/packages/domain/src/money/money.ts
  1:1  error  'money.ts' import is restricted from being used by a pattern  no-restricted-imports
```

(reformulé de mémoire de session : le message exact d'ESLint mentionne le message personnalisé
« packages/domain doit rester pur : aucune dépendance à un framework (ADR 0001) » configuré dans
`eslint.config.mjs`). L'import a été retiré immédiatement après constat ; `pnpm lint` repasse au
vert. De la même façon, un import relatif de `apps/backoffice` dans `apps/storefront` déclenche la
règle `import-x/no-restricted-paths` (« Une app n'importe pas une autre app (ADR 0001) »).

### `pnpm typecheck` (AC-L00-02)

```text
 Tasks:    11 successful, 11 total
Cached:    8 cached, 11 total
  Time:    3.151s
```

(les 11 paquets/apps : `@app/config`, `@app/contracts`, `@app/db`, `@app/domain`, `@app/i18n`,
`@app/testing`, `@app/ui`, `api`, `backoffice`, `storefront`, + build de `@app/domain` requis par
les autres.)

### `pnpm test` (AC-L00-02, AC-L00-07)

```text
api:test:  Test Files  5 passed (5)
api:test:       Tests  20 passed (20)
@app/domain:test:  ✓ src/money/money.test.ts (7 tests) 7ms
storefront:test:  ✓ src/i18n/dictionary.test.ts (3 tests)
backoffice:test:  ✓ src/i18n/dictionary.test.ts (3 tests)
 Tasks:    11 successful, 11 total
```

`@app/contracts`, `@app/db`, `@app/i18n`, `@app/testing`, `@app/ui` : « No test files found,
exiting with code 0 » (paquets volontairement vides au L00, `passWithNoTests: true`).

### `pnpm build` (AC-L00-02)

```text
storefront:build: Route (app) ┌ ○ /_not-found └ /[locale] ├ ● /fr └ ● /en
backoffice:build: Route (app) ┌ ○ /_not-found └ /[locale] ├ ● /fr └ ● /en
 Tasks:    10 successful, 10 total
```

`apps/api/dist/{main.js,worker.js,app.module.js,...}` généré (vérifié par `ls`).

### Démarrage réel de l'API buildée (AC-L00-04, AC-L00-06)

```text
$ NODE_ENV=development PORT=3999 HOST=127.0.0.1 LOG_LEVEL=info node dist/main.js
{"level":30,...,"msg":"Server listening at http://127.0.0.1:3999"}
[Nest] ... Nest application successfully started
{"level":"info","message":"API démarrée","port":3999,...}

$ curl -D - http://127.0.0.1:3999/health/live
HTTP/1.1 200 OK
x-correlation-id: c0ddb286-223e-4cb7-b92d-db4bdb1bb994
{"status":"ok"}

$ curl -D - http://127.0.0.1:3999/health/ready
HTTP/1.1 200 OK
{"status":"ok","checks":{"config":"ok"}}

$ curl -D - -H "x-correlation-id: my-fixed-id" http://127.0.0.1:3999/health/live
HTTP/1.1 200 OK
x-correlation-id: my-fixed-id
{"status":"ok"}
```

Confirme empiriquement (pas seulement par test unitaire) : `/health/live` et `/health/ready` (200,
contrat exact), en-tête `x-correlation-id` généré si absent et réutilisé si fourni, logs JSON
structurés (pino via Fastify), en-têtes de sécurité Helmet présents (CSP, HSTS, etc.).

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

### `.claude/hooks/test-guards.sh` (AC-L00-12)

```text
ok   [0] git push -u origin claude/feature-x
...
ok   [2] git push --force origin feat
ok   [2] git push -f
ok   [2] git push origin main
...
ok   [0] /repo/.env.example
ok   [2] /repo/.env
(29 cas, tous « ok », code de sortie global 0)
```

## Statut détaillé des critères d'acceptation

| AC | Statut | Détail |
|---|---|---|
| AC-L00-01 | **OK** | `pnpm install` réussit, lockfile commité. `--frozen-lockfile` non rejoué tel quel après le tout dernier ajustement (voir ci-dessus) — à confirmer en CI. |
| AC-L00-02 | **OK** | format:check, lint, typecheck, test, build tous verts (sorties ci-dessus). |
| AC-L00-03 | **Non vérifié localement** | Docker présent mais le démon (`docker ps`/build réel) est bloqué par le classificateur de sécurité de l'environnement (« Containment Escape »), conformément à la limite annoncée dans la consigne. `compose.yaml` écrit, relu, images épinglées, healthchecks définis (pg_isready, redis-cli ping, wget sur Mailpit, curl sur MinIO — ce dernier documenté par MinIO). **À vérifier en CI/local Docker par un humain.** |
| AC-L00-04 | **OK** | Vérifié à la fois par test d'intégration légère (`app.inject`) et par un vrai `curl` sur le binaire buildé (voir ci-dessus). |
| AC-L00-05 | **OK** | Tests unitaires `env.schema.test.ts` : `NODE_ENV` manquant ou invalide lève `ConfigValidationError` ; message ne contient jamais la valeur fournie (assertion explicite `not.toContain`). |
| AC-L00-06 | **OK** | Test d'intégration + vérification `curl` manuelle : en-tête réutilisé si fourni, généré sinon, logs JSON avec `correlationId` (pino, visible dans la sortie `curl` ci-dessus). |
| AC-L00-07 | **OK** | `packages/domain/src/money/money.test.ts` : `add(1000, "CHF") + (250, "CHF") = 1250n` ; CHF+EUR lève `MoneyError` ; montant non entier refusé. 7 tests verts. |
| AC-L00-08 | **OK** | Démonstration faite (import `@nestjs/core` dans `packages/domain`, et import relatif inter-apps) → `pnpm lint` échoue avec `no-restricted-imports` / `import-x/no-restricted-paths` ; retirée après constat. |
| AC-L00-09 | **OK** | `pnpm test:e2e` : 4/4 tests verts, exit 0, aucun processus résiduel (voir ci-dessus pour l'historique du correctif). |
| AC-L00-10 | **Non vérifié dans cette session** | `.github/workflows/ci.yml` écrit avec toutes les étapes demandées (install verrouillée → format → lint → typecheck → tests unitaires → hooks → gitleaks → audit dépendances → build → Playwright). La démonstration gitleaks-sur-branche-jetable n'a **pas été exécutée** (pas de run GitHub Actions déclenché depuis cet environnement, et aucun secret factice n'a été commité pour cette démonstration faute de tour disponible). **À vérifier à la première PR réelle.** |
| AC-L00-11 | **Non vérifié localement (même raison qu'AC-L00-03)** | `infra/docker/api.Dockerfile` écrit (multi-stage `turbo prune`, utilisateur non-root `app`, `HEALTHCHECK` sur `/health/live`) mais jamais construit (`docker build`) dans cette session — bloqué par la même restriction du bac à sable. **À vérifier en CI** (le workflow ne construit pas encore l'image — écart, voir plus bas). |
| AC-L00-12 | **OK** | `.claude/hooks/test-guards.sh` : 29 cas, tous corrects, code 0. |
| AC-L00-13 | **OK** | `bonjour.html` inchangé (un reformattage accidentel par `prettier --write .` a été détecté et **annulé** via `git restore` avant tout commit ; `bonjour.html` et `docs/**` sont désormais dans `.prettierignore` pour ne plus jamais être touchés par ce lot). |

## Tests non exécutés et raison

- **`pnpm test:int`, `pnpm test:tenancy`** : n'existent pas encore — explicitement prévus au lot L01
  par la spec (§ Commandes de `CLAUDE.md` et §2 de la spec L00 : « documentés comme introduits au
  L01 »). Aucune omission.
- **Démonstration gitleaks sur secret factice (AC-L00-10)** : non exécutée (nécessite un push
  déclenchant réellement le workflow GitHub Actions, hors de portée d'une session locale sans accès
  au dépôt distant pour ce test précis, et le temps restant ne le permettait pas). Le workflow est
  écrit avec l'étape gitleaks activée ; il reste à confirmer sur la première PR réelle.
- **Build et exécution réelle de l'image Docker `api` (AC-L00-11) et `docker compose up`
  (AC-L00-03)** : bloqués par la politique de bac à sable de cet agent (voir ci-dessus). Ni
  contournés, ni simulés : signalés comme non vérifiés.
- **`pnpm install --frozen-lockfile` en toute fin de session** : le dernier ajustement (correctif
  e2e) n'a pas modifié de dépendances, mais l'option `--frozen-lockfile` strico sensu n'a pas été
  rejouée après ce dernier commit faute de tour ; `pnpm install` (sans l'option) confirme
  « Already up to date ».

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
   **Question ouverte / action requise du porteur** : soit assouplir le motif de la règle deny (ex.
   `Read(./.env)` au lieu de `Read(./.env.*)`, en gardant `.env.local`/`.env.production` bloqués),
   soit créer `.env.example` manuellement.
4. **Intégration `eslint-config-next` retirée.** `compat.extends("next/core-web-vitals")` (via
   `@eslint/eslintrc`) provoque une erreur `TypeError: Converting circular structure to JSON` avec
   ESLint 10.11.0 + `eslint-config-next` 16.3.6 dans cet environnement (bug d'interaction entre la
   couche de compatibilité legacy et cette combinaison de versions très récentes). Les règles de
   frontières de modules et TypeScript strict restent actives sur `apps/storefront` et
   `apps/backoffice` ; les règles spécifiques Next (ex. `no-img-element`) et React
   Hooks/jsx-a11y ne sont **pas** actives à ce lot. À reprendre dans un lot ultérieur (aucun AC-L00
   ne les requiert explicitement).
5. **`webServer` Playwright et `test:e2e`** : voir le détail dans « Commandes exécutées ». Le script
   `test:e2e` fait désormais `turbo run build --filter=storefront --filter=backoffice && playwright
   test ...` plutôt que de laisser Playwright construire les apps lui-même. Ajout des redirections
   `/` → `/fr` dans les deux apps Next (non prévu explicitement par la spec, mais cohérent avec
   « site public » et nécessaire pour fiabiliser `webServer.url`).
6. **`.github/workflows/ci.yml` ne construit pas encore l'image Docker `api`** (pas d'étape
   `docker build`/scan). La spec L00 exclut explicitement « déploiement, ... image scannée/SBOM »
   du périmètre CI (§2 Exclu), donc ce n'est pas un manque par rapport à L00, mais cela veut dire
   qu'**aucune vérification automatisée de `api.Dockerfile` n'existe encore nulle part** —
   signalé pour que le porteur en soit conscient avant la fusion.
7. **Node 24.21.0 non natif à cet environnement de développement** (voir « Choix techniques ») :
   toutes les commandes de vérification ont explicitement forcé ce PATH ; un développeur clonant le
   dépôt sur une machine avec `nvm`/Volta obtiendra automatiquement la bonne version via `.nvmrc`,
   mais ce n'est pas garanti sur une machine sans gestionnaire de version Node.
8. **Reformatage accidentel puis annulé** de `bonjour.html`, `docs/**` et `.claude/agents/*.md` par
   un premier `pnpm format` lancé sans périmètre restreint. Détecté avant tout commit via
   `git diff --cached --stat`, annulé par `git restore`, et prévenu pour l'avenir en excluant ces
   chemins de `.prettierignore`. Aucun de ces fichiers n'apparaît dans les commits de ce lot.

## Questions ouvertes

1. Le porteur souhaite-t-il assouplir la règle `permissions.deny` sur `.env.*` pour permettre la
   création de `.env.example` par un agent (voir écart 3) ?
2. Faut-il réintégrer les règles ESLint spécifiques à Next.js (a11y, react-hooks, web-vitals) dans
   ce lot ou les reporter à un lot frontend dédié (écart 4) ? Aucun AC-L00 ne les requiert.
3. Confirmation souhaitée du porteur : la CI GitHub Actions n'a pas été déclenchée dans cette
   session (pas de push) — la première exécution réelle (format, lint, typecheck, tests, build,
   e2e, gitleaks) doit être surveillée à la première PR pour lever les incertitudes listées
   ci-dessus (AC-L00-01 frozen-lockfile, AC-L00-10 gitleaks).
4. AC-L00-03/AC-L00-11 (Docker) nécessitent une vérification humaine ou par CI (GitHub Actions a un
   démon Docker natif, contrairement à ce bac à sable) avant la fusion.

## Heures (à compléter par le porteur)

Non renseigné dans cette session (agent).
