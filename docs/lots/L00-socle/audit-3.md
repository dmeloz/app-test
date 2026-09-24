# Audit 3 (contre-audit) — Lot L00 — 2026-09-24

- **Auditeur** : auditor-opus · **Périmètre** : `01ef534..15309bb` · **Méthode** : clone propre, Node 24.21.0, pnpm 12.6.0.

## Vérifications rejouées (sorties réelles)
- install `--frozen-lockfile` : EXIT=0.
- **`pnpm test` sans build préalable** : EXIT=0, 11/11 (api 33, domain 9, storefront 3, backoffice 3), sans avertissement ESM/CJS.
- format, lint, typecheck (10/10) : EXIT=0.
- lint-boundaries : 17/17.
- build : 10/10, `/_not-found` et `/[locale]` en rendu dynamique.
- e2e : **13 passed**, aucun processus résiduel.
- `test-guards.sh` : 36 ok. Le rapport en annonçait 31, voir R1-bis.
- `pnpm audit` critique : aucune vulnérabilité.
- Logs de l'API buildée : JSON avec `correlationId`, `req:{method,url}` sans query ; 0 token, IP ou host.
- Sonde navigateur sur 20 URL, 404 compris : 0 erreur CSP ni JS.
- Images : 5 images, le tag résout exactement vers le digest épinglé.
- SeaweedFS 4.47 : Apache-2.0 ; commande `mini` gérée par l'entrypoint ; `curl` présent ; `/healthz` réel 200.
- CI : YAML valide ; tests avant build fonctionnels ; SHA des actions valides ; SHA-256 de gitleaks 8.30.1 revérifié par téléchargement ; historique complet sans fuite ; détection positive démontrée en local.
- Dockerfile simulé hors Docker : déploiement de 40 Mo, sans outil de dev.
- `pnpm dev` : rechargement OK ; SIGINT au groupe → arrêt propre, aucune assertion.

Non rejoué : `docker build`/`run`, `compose up --wait`, run GitHub Actions réel.

## Critères d'acceptation
- **OK** : 01, 02, 04 à 09, 12 (en local).
- **Non vérifiés ici, simulation probante** : 03, 10, 11. Ce sont des conditions de fusion.
- **Sans objet** : 13.

## Suivi de l'audit 2
- **Résolus** : N1, H4 (réserve : `compose up` réel), M1, N4, N5 (run CI à confirmer), N6, N8, N9, N10, L5.
- **Partiel** : R1, voir R1-bis.
- **Non résolu, régression** : N7, voir N11.

## Nouveaux constats
- **[MEDIUM] N11** — La règle `.env` de `fba8082` laissait passer `cat .env|head`, `cat .env;echo`, `cat <.env`, `.env.production.local`, `.env.development.local`, `.env.local.bak`, `.env.example.local` et `.env.sample.bak`. Deux causes : un seul suffixe accepté, et des terminateurs trop restreints.
- **[MEDIUM] R1-bis** — Le rapport cite des chiffres faux ou périmés : « 31 cas » présentés comme rejoués, typecheck « 11 », extraits de build et de logs d'avant correctif présentés comme actuels, contradiction sur `--frozen-lockfile`, lignes de `ci.yml`.
- **[LOW] L-a** — Le reporter Playwright HTML n'est pas configuré, donc l'artefact CI `playwright-report/` est vide.
- **[LOW] L-b** — `layout.tsx` contient un commentaire inexact (`[locale]/not-found.tsx` inexistant), et le titre 404 est en anglais seul pour `/xx`.
- **[INFO]** :
  - I-a : `process.getBuiltinModule` contourne N9 (types node dans domain).
  - I-b : la 404 JSON renvoie la query string au client.
  - I-c : aucun identifiant S3 de dev prévu (à traiter au premier lot stockage).
  - I-d : `/healthz` ne vérifie que la vivacité du master.
  - I-e : avertissements turbo sur `coverage/**`.
  - I-f : `docker exec id -u` au lieu de l'uid de PID 1.
  - I-g : en-tête du rapport à corriger.

## Conditions de fusion (CI ou humain)
1. Premier run CI vert, jobs `ci` et `docker-api`.
2. `compose up --wait` : 4 services healthy.
3. Démonstration gitleaks en CI.
4. `cp .env.example .env && pnpm dev` par un humain.
5. Protection de `main`.

## Verdict
**CHANGES_REQUIRED** — 0 BLOCKER, 0 HIGH ; 2 MEDIUM ciblés (N11, R1-bis). Audit 4 limité à N11, R1-bis, L-a et L-b.

## Suivi Opus (fil principal)
- **N11 corrigé par Opus** (garde-fous `.claude/`, son périmètre) : suffixes multiples, terminateurs `| ; & < > )`, redirection `<.env`, liste d'autorisation limitée aux modèles terminaux exacts. `test-guards.sh` : **45/45**, dont les 9 nouveaux cas de l'audit.
