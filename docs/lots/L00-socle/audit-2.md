# Audit 2 (contre-audit) — Lot L00 — 2026-09-24

- **Auditeur** : auditor-opus · **Périmètre** : `c1c5591..01ef534` (+ `9020ee5`, `e8b7fb1`, `fa42f12`), hors docs de cadrage.
- **Méthode** : clone propre de `01ef534`, Node 24.21.0, pnpm 12.6.0 ; dépôt de travail non modifié ; aucun processus résiduel.

## Vérifications rejouées (sorties réelles)

| Commande | Résultat |
|---|---|
| `install --frozen-lockfile`, `format:check`, `lint`, `typecheck` | EXIT=0 |
| **`pnpm test` sur clone propre, avant build** | **EXIT=1** : `main-shutdown` et `worker` integration échouent (`dist` absent) → N1 |
| `pnpm build` | 10/10 ; routes `/[locale]` en rendu dynamique + proxy |
| `pnpm test` après build | EXIT=0 (api 32, domain 9, storefront 3, backoffice 3) |
| `test:lint-boundaries` | 15/15 |
| `test-guards.sh` | 31 ok |
| `pnpm audit --prod --audit-level=critical` | aucune vulnérabilité |
| `timeout 600 pnpm test:e2e` | 9 passed, EXIT=0, aucun résidu |
| API buildée + curl | health 200 ; 404 structuré avec correlationId ; logs 100 % JSON avec correlationId ; SIGTERM → 0 |
| Worker | vivant à 2 s ; SIGTERM → 0 + « Worker arrêté » |
| Config invalide | « valeur invalide » / « variable manquante », valeur jamais affichée |
| `pnpm dev` | API, storefront, backoffice en 200 ; plantage natif sur Ctrl+C (N6) |
| 14 sondes ESLint indépendantes | 12 rejetées ; 2 contournements mineurs (N9) |
| Console navigateur | 0 erreur sur les pages nominales ; **14 erreurs CSP sur les pages 404** (M1) ; HTML en `no-store` |
| Simulation Docker (prune + deploy --prod) | 40 Mo, aucun outil de dev, fichiers root non modifiables, SIGTERM → 0 |
| SHA des 5 actions (`git ls-remote`) | tous valides |
| Registres | postgres, redis, mailpit, node, localstack : présents ; **LocalStack = image « Pro »** (H4) |
| GitHub | dépôt **public** ; 0 exécution Actions |

Non rejoué : `docker build`/`compose up` (démon indisponible), runs CI, `cp .env.example .env` (bloqué par le hook de garde), exécution non-root.

## Critères d'acceptation

| AC | Statut |
|---|---|
| 01 | OK |
| 02 | **KO** — `pnpm test` échoue sur clone propre sans build préalable (N1) |
| 03 | **Non vérifié, KO probable** — LocalStack Pro (H4) |
| 04, 05, 06, 07, 08, 09, 12 | OK |
| 10 | Non vérifié — 0 run CI ; la CI échouerait aux tests (N1) ; portée gitleaks (N5) |
| 11 | Non vérifié (simulation OK) — le job `docker-api` dépend du job `ci`, bloqué par N1 |
| 13 | Sans objet (bonjour.html retiré à la demande du porteur) |

## Suivi des constats de l'audit 1

- **Résolus (18)** : H1, H2, H3 (en simulation), H6, M2, M3, M4, M5, M6, M7 (en simulation), M8, L1, L2, L3, L4, L6, L7.
- **Partiellement résolus (4)** :
  - H5 : pas de démonstration AC-10, et limite de scan N5.
  - H7 : reclassé MEDIUM, voir R1.
  - M1 : pages 404, rendu dynamique et cache.
  - L5 : images non épinglées par digest.
- **Non résolu (1)** : H4.

## Constats ouverts

- **[HIGH] N1** — `turbo.json:17` utilise la clé `"apps/api#test"`, mais le paquet s'appelle `api` : la surcharge est ignorée, et les tests qui lancent `dist/` échouent sans build préalable. La CI sera rouge et le job `docker-api` ne s'exécutera jamais. **Correctif** : clé `"api#test"` avec `dependsOn: ["^build","build"]`. **Test** : sur clone propre, `pnpm install --frozen-lockfile && pnpm test` → EXIT=0.
- **[HIGH] H4** — `localstack/localstack:2026.08.4` est l'image LocalStack **Pro** : le dépôt communautaire est archivé, l'offre gratuite est non commerciale, et un jeton d'authentification est géré. Le healthcheck ne correspond pas à l'image épinglée, et la justification dans `self-hosting.md` est inexacte. **Correctif** : image S3 libre, sans compte, épinglée ; healthcheck vérifié dans l'image ; doc corrigée ; décision consignée.
- **[MEDIUM] M1** (partiel) — `/_not-found` est prérendu sans nonce, d'où 14 erreurs CSP sur les pages 404 ; styles inline bloqués ; HTML en `no-store` (aucun cache CDN). **Correctif** : `not-found` dynamique, e2e sur une URL 404, note d'architecture sur le rendu dynamique, le cache et la contrainte « pas de style inline » pour le thème.
- **[MEDIUM] N4** — Les logs de requête contiennent la query string (`?token=…`), l'IP et le host : pas de liste d'autorisation. **Correctif** : sérialiseur qui ne garde que la méthode et la route sans query, sans IP. **Test** : `?token=x` absent des logs.
- **[MEDIUM] N5** — `gitleaks-action` ne scanne que les 30 premiers commits d'une PR (API non paginée). **Correctif** : CLI gitleaks épinglée (version et SHA-256) sur tout l'historique.
- **[MEDIUM] R1** (ex-H7) — Rapport d'implémentation contradictoire : H4, AC-11, écart 6, AC-13 et nombre de tests. **Correctif** : statuts et « reste ouvert » à jour, sorties sur clone propre.
- **[LOW]** :
  - N6 : double SIGINT dans `dev.mjs`, qui provoque une assertion native.
  - N7 : la liste deny des `.env` procède par énumération (`.env.dev`, `.env.backup`… non couverts).
  - N8 : `npx --yes turbo@2.11.3` hors lockfile dans le Dockerfile.
  - N9 : `createRequire` et `import()` de type non interdits dans domain.
  - N10 : avertissement Vite ESM/CJS dans `vitest.config.ts`.
  - L5 : images non épinglées par digest.
- **[INFO]** :
  - I1 : **dépôt public**, donc stratégie, prix et démarchage lisibles par tous (décision du porteur).
  - I2 : actions v4 sous Node 20.
  - I3 : `HOST=0.0.0.0` en dev.
  - I4 : maxTurns 250 sans impact de sécurité.
  - I5 : nouvelles dépendances de dev toutes justifiées et épinglées, aucune dépendance de production.

## Conditions à confirmer par la CI ou un humain avant fusion
1. Premier run CI vert après N1.
2. Job `docker-api` réel : build, uid ≠ 0, health.
3. `docker compose up -d --wait` : 4 services healthy.
4. Démonstration gitleaks AC-10.
5. `cp .env.example .env && pnpm dev` par un humain.

## Verdict

**CHANGES_REQUIRED** — 2 HIGH ouverts (N1, H4) et 4 MEDIUM (M1, N4, N5, R1). Audit 3 requis.

## Arbitrage Opus (fil principal) sur H4 — 2026-09-24

Sous la carte blanche du porteur, pour un outil de **développement uniquement** (aucune donnée, réversible) :
**SeaweedFS** (`chrislusf/seaweedfs`, licence Apache-2.0, sans compte, S3-compatible, également utilisable
en auto-hébergement futur) remplace LocalStack. L'implémenteur doit vérifier le tag exact et le binaire du
healthcheck dans l'image épinglée. Alternative si SeaweedFS pose problème : `versity/versitygw` (Apache-2.0).
Le choix sera réexaminé avec l'ADR 0012 pour la production.
