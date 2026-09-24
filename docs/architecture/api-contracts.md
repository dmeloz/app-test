# Contrats d'API — premier niveau

> Statut : PROPOSÉ. Les schémas exacts (Zod → OpenAPI) sont définis dans chaque spec de lot.

## Conventions

- Base : `/v1`. JSON UTF-8. Champs en `camelCase`. Dates ISO 8601 UTC. Montants : `{ "amount": 1850, "currency": "CHF" }`.
- En-têtes : `x-correlation-id` (accepté ou généré, renvoyé), `Idempotency-Key` (obligatoire sur les POST
  qui créent une commande, un paiement ou un remboursement), `Accept-Language` (`fr`, `en`).
- Erreurs : `{ "error": { "code": "SLOT_FULL", "message": "…", "correlationId": "…", "details": {…} } }`.
  Codes HTTP : 400 validation, 401, 403, 404 (aussi pour objet d'un autre tenant), 409 conflit/état,
  422 règle métier, 429 rate limit.
- Le tenant n'apparaît jamais comme paramètre public ; il est résolu par le domaine ou la session.
- Pagination par curseur (`?cursor=…&limit=…`).

## API publique (site du restaurant)

| Méthode | Route | Description | Notes |
|---|---|---|---|
| GET | `/v1/restaurants/{slug}` | Identité, établissements, canaux actifs, horaires, pause, thème publié | Cacheable |
| GET | `/v1/restaurants/{slug}/menu?channel=&locationId=` | Menu publié (version), dispo, ruptures, allergènes validés | Cache par version |
| GET | `/v1/restaurants/{slug}/slots?channel=&locationId=&date=` | Créneaux avec capacité restante | **Corrigé** : `{slug}` au lieu de `{id}` |
| POST | `/v1/delivery/validate-address` | Géocode + éligibilité zone + frais + minimum | Rate-limité ; mode manuel si fournisseur indisponible |
| POST | `/v1/quotes` | Devis serveur d'un panier (lignes, taxes, frais, total, alertes de prix/rupture) | Aucune écriture |
| POST | `/v1/carts` · PUT `/v1/carts/{id}` | Panier serveur (token de panier) | Pas de prix stocké |
| POST | `/v1/orders` | Crée la commande `PENDING_PAYMENT` + réservation de créneau | `Idempotency-Key` requis |
| POST | `/v1/orders/{id}/checkout` | Crée la Checkout Session/PaymentIntent (compte connecté) | Idempotent ; renvoie URL/secret client |
| GET | `/v1/orders/{publicToken}` | Suivi de commande (données minimales) | Token ≥ 128 bits, expirant ; rate-limité |
| POST | `/v1/orders/{publicToken}/cancel-request` | Demande d'annulation client | Selon politique ; ajout proposé |
| POST | `/v1/customer-consents` | Enregistre/retire un consentement | Versionné |

## API d'administration (session OIDC + RBAC)

| Méthode | Route | Permission |
|---|---|---|
| GET | `/v1/admin/orders?status=&locationId=` | `order.read` |
| GET | `/v1/admin/orders/stream` (SSE) | `order.read` |
| POST | `/v1/admin/orders/{id}/accept` | `order.accept` |
| POST | `/v1/admin/orders/{id}/reject` (motif obligatoire) | `order.reject` |
| POST | `/v1/admin/orders/{id}/status` (transition nommée) | `order.update_status` |
| POST | `/v1/admin/orders/{id}/delay` | `order.update_status` |
| POST | `/v1/admin/orders/{id}/refunds` | `refund.create` (+ plafond, + réauth au-delà) |
| POST | `/v1/admin/refunds/{id}/approve` | `refund.approve` |
| CRUD | `/v1/admin/menus`, `/v1/admin/menus/{id}/versions`, `…/publish` | `menu.write`, `menu.publish` |
| CRUD | `/v1/admin/products`, `/v1/admin/option-groups` | `menu.write` |
| PUT | `/v1/admin/stock` (rupture) | `stock.write` |
| PUT | `/v1/admin/availability` | `menu.write` |
| PUT | `/v1/admin/opening-hours`, CRUD `/v1/admin/closures` | `location.write` |
| PUT | `/v1/admin/locations/{id}/pause` | `location.pause` |
| CRUD | `/v1/admin/delivery-zones` | `delivery.write` |
| CRUD | `/v1/admin/promotions` | `promotion.write` (après pilote) |
| CRUD | `/v1/admin/members` | `member.manage` (+ réauth pour rôle critique) |
| PUT | `/v1/admin/theme`, POST `/v1/admin/theme/publish` | `branding.write` |
| PUT | `/v1/admin/tax-profile` | `tax.write` (owner) |
| GET | `/v1/admin/reports/sales` | `report.read` |
| GET | `/v1/admin/exports/orders` | `export.orders` (+ réauth si massif) |
| GET | `/v1/admin/audit-logs` | `audit.read` |

## API opérateur plateforme (`/v1/platform/*`, rôle opérateur + MFA)

Tenants, onboarding, feature flags, accès support temporaire, santé par restaurant, export de tenant.

## Webhooks et santé

| Méthode | Route | Notes |
|---|---|---|
| POST | `/v1/webhooks/stripe` | Corps brut, signature + tolérance temporelle, dédup `event.id`, stockage puis traitement asynchrone |
| POST | `/v1/webhooks/email` | Signature du fournisseur ; statuts de délivrance |
| POST | `/v1/integrations/{provider}/webhook` | Port d'intégration ; même pipeline |
| GET | `/health/live`, `/health/ready` | `ready` vérifie DB, Redis, retard de l'outbox |
| GET | `/metrics` | Prometheus/OTel, réseau interne uniquement |

## Contrats d'intégration (ports, après pilote)

`MenuSyncPort`, `OrderDispatchPort` (transmission + accusé de réception), `StatusUpdatePort`,
`PrinterPort`, `DeliveryProviderPort`, `AccountingExportPort`. Chacun : déduplication par clé, retry
exponentiel, dead-letter, réconciliation manuelle, mode dégradé (impression navigateur, saisie manuelle).
