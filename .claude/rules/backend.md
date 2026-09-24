---
paths:
  - "apps/api/**/*"
  - "packages/contracts/**/*"
---

# Règles backend (NestJS + Fastify)

- API REST JSON versionnée `/v1`, documentée par OpenAPI générée depuis `packages/contracts` ; un test
  vérifie que le document OpenAPI est à jour.
- Toute entrée est validée par un schéma Zod strict (`.strict()`, champs inconnus rejetés).
- Erreurs structurées : `{ error: { code, message, correlationId, details? } }`. Aucun stack trace exposé.
- Chaque requête porte un `correlationId` (en-tête `x-correlation-id` accepté ou généré) propagé aux logs,
  à l'outbox et aux appels fournisseurs.
- Le tenant est résolu côté serveur (domaine → restaurant pour le public ; session → membership pour
  l'admin). Tout `tenantId` présent dans un corps ou une query est ignoré ou rejeté.
- Les routes admin passent par un guard RBAC explicite (permission nommée), jamais par défaut ouvert.
  Un test vérifie qu'aucune route admin n'est dépourvue de décorateur de permission.
- Mutations financières et créations de commande : en-tête `Idempotency-Key` obligatoire, stocké avec
  le hash de la requête ; un rejeu renvoie la même réponse, un conflit renvoie 409.
- Rate limiting par IP, compte, tenant et opération ; limites renforcées sur connexion, coupon, paiement,
  remboursement, suivi public et SMS.
- Logs JSON structurés : jamais d'e-mail, téléphone, adresse, token, secret ou payload PSP complet.
- `/health/live`, `/health/ready` (DB, Redis, outbox) et `/metrics` (non public).
