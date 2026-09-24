# syntax=docker/dockerfile:1
#
# Image multi-stage, non-root, pour `apps/api` (sert aussi au worker : `node dist/worker.js`).
# Suit le modèle officiel Turborepo (`turbo prune`) pour ne construire que le sous-graphe
# nécessaire à l'API (ADR 0001, ADR 0002).
#
# Construire depuis la racine du monorepo :
#   docker build -f infra/docker/api.Dockerfile -t restaurant-saas-api .
# Lancer (API) :
#   docker run --rm -p 3000:3000 --env-file .env restaurant-saas-api
# Lancer (worker) :
#   docker run --rm --env-file .env restaurant-saas-api node dist/worker.js
# `tini` est déjà l'entrypoint de l'image (PID 1, forward des signaux + récupération des
# processus zombies) : `docker run --init` n'est donc pas nécessaire avec cette image. Si une
# image dérivée retire `tini`, ajouter `--init` au `docker run` est l'alternative documentée
# (M7, audit-1.md).
#
# L5 (audit-2.md) : digest obtenu via l'API Docker Hub
# (`GET /v2/repositories/library/node/tags/24.21.0-alpine`, champ `digest`, 2026-09-24), tag conservé.

FROM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@12.6.0 --activate
WORKDIR /repo

FROM base AS pruner
COPY . .
# N8 (audit-2.md) : `npx --yes turbo@2.11.3` téléchargeait `turbo` directement depuis le registre
# npm, hors lockfile — aucune vérification d'intégrité contre `pnpm-lock.yaml`, version en clair
# dans la commande plutôt que dans `package.json`. `turbo` est déjà une dépendance de développement
# épinglée exactement du monorepo (`package.json` racine, verrouillée par `pnpm-lock.yaml`) :
# `pnpm install --frozen-lockfile` (refuse toute divergence avec le lockfile) puis `pnpm exec turbo`
# utilisent ce même binaire, verrouillé et vérifié, sans jamais atteindre le registre en dehors du
# lockfile.
RUN pnpm install --frozen-lockfile
RUN pnpm exec turbo prune api --docker

FROM base AS installer
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile

FROM installer AS builder
COPY --from=pruner /repo/out/full/ .
COPY turbo.json ./turbo.json
# H3 (audit-1.md) : `turbo prune --docker` ne copie que les fichiers rattachés aux packages du
# sous-graphe (via `package.json`/`pnpm-workspace.yaml`) ; `tsconfig.base.json`, référencé par
# `extends` depuis `apps/api/tsconfig.json`, n'en fait pas partie et reste absent de
# `out/full/` — `tsc` échoue alors avec `TS5083: Cannot read file '.../tsconfig.base.json'`.
# Copié explicitement depuis la racine du contexte de build (voir simulation dans le rapport).
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm turbo run build --filter=api...

# M7 (audit-1.md) : `pnpm deploy --prod` matérialise dans un répertoire autonome UNIQUEMENT le
# paquet `api` et ses dépendances de PRODUCTION résolues (`apps/api/package.json` → `dependencies`
# seulement). Les outils de développement du monorepo (typescript, vitest, eslint,
# @playwright/test, turbo…) présents dans `builder` n'y sont jamais copiés. `--frozen-lockfile`
# interdit toute réécriture du lockfile déployé ; le store pnpm déjà peuplé par `installer` évite
# tout accès réseau (preuve : simulation hors Docker dans le rapport d'implémentation, section M7 —
# `reused 79, downloaded 0`). Le résultat est ensuite dépouillé des sources/tests/config qui ne
# servent qu'au build (seuls `dist/`, `node_modules/` et `package.json` sont utiles à l'exécution).
FROM builder AS deployer
RUN pnpm --filter api deploy --prod --frozen-lockfile /repo/deploy \
  && rm -rf /repo/deploy/src /repo/deploy/test /repo/deploy/scripts /repo/deploy/.turbo \
    /repo/deploy/tsconfig.json /repo/deploy/tsconfig.build.json /repo/deploy/vitest.config.ts \
    /repo/deploy/pnpm-lock.yaml /repo/deploy/pnpm-workspace.yaml

# M7 : stage runtime reconstruit depuis `node:*-alpine` (pas `base`) — ni pnpm/corepack ni les
# sources du monorepo n'y entrent jamais, seul le contenu autonome produit par `deployer`.
FROM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info
# `tini` : PID 1 propre — transmet SIGTERM/SIGINT au process Node et récupère les processus
# zombies (bonne pratique standard des images de production, M7 audit-1.md).
RUN apk add --no-cache libc6-compat tini
RUN addgroup -S app && adduser -S app -G app
WORKDIR /repo/apps/api
# M7 : PAS de `--chown=app:app` ici — les fichiers copiés restent la propriété de l'utilisateur de
# build (root), avec les permissions par défaut (lecture/exécution pour tous, écriture pour le
# seul propriétaire). L'utilisateur d'exécution `app` (non-root, activé juste après) peut donc lire
# et exécuter le code livré mais ne peut ni le modifier ni y écrire quoi que ce soit.
COPY --from=deployer /repo/deploy .
USER app

EXPOSE 3000
# M7 : le port testé suit désormais `${PORT}` (forme shell : `HEALTHCHECK CMD <commande>` sans
# tableau JSON est exécutée via `/bin/sh -c`, qui interpole les variables d'environnement) au lieu
# du port `3000` codé en dur — un `docker run -e PORT=...` change bien le port sondé.
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
