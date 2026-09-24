# syntax=docker/dockerfile:1
#
# Image multi-stage, non-root, pour `apps/api` (sert aussi au worker : `node dist/worker.js`).
# Suit le modèle officiel Turborepo (`turbo prune`) pour ne construire que le sous-graphe
# nécessaire à l'API (ADR 0001, ADR 0002).
#
# Construire depuis la racine du monorepo :
#   docker build -f infra/docker/api.Dockerfile -t restaurant-saas-api .

FROM node:24.21.0-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@12.6.0 --activate
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN npx --yes turbo@2.11.3 prune api --docker

FROM base AS installer
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile

FROM installer AS builder
COPY --from=pruner /repo/out/full/ .
COPY turbo.json ./turbo.json
RUN pnpm turbo run build --filter=api...

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info
RUN addgroup -S app && adduser -S app -G app
WORKDIR /repo
COPY --from=builder --chown=app:app /repo .
USER app
WORKDIR /repo/apps/api

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/health/live || exit 1

CMD ["node", "dist/main.js"]
