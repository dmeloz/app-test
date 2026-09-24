# Multi-tenancy

## Hiérarchie

```text
Tenant (client SaaS : entité contractuelle, 1 abonnement)
 └─ Restaurant (marque / enseigne : thème, domaine(s), menus, compte Stripe connecté, entité légale vendeuse)
     └─ Location (établissement : adresse, horaires, canaux, capacité, zones, profil fiscal)
```

Un tenant peut posséder plusieurs restaurants (multi-marque) ; un restaurant plusieurs établissements.
Le compte Stripe connecté est rattaché au **restaurant** (entité légale vendeuse) ; si deux marques d'un
même tenant ont des entités légales différentes, elles ont des comptes différents.

## Résolution du tenant (jamais depuis le client)

| Contexte | Source | Mécanisme |
|---|---|---|
| Site public | En-tête `Host` | `domain.hostname` (vérifié, actif) → `restaurant_id` → `tenant_id` |
| API publique | Idem (storefront → API avec `Host` d'origine signé) ou `{slug}` résolu serveur | Slug unique global |
| Back-office | Session OIDC → `membership` | L'utilisateur choisit un tenant **parmi ses memberships** ; le serveur vérifie |
| Webhooks Stripe | `event.account` (compte connecté) | `payment_account.stripe_account_id` → restaurant → tenant |
| Worker | Message outbox | `tenant_id` stocké dans le message à l'écriture |
| Support opérateur | `support_access_grant` | Accès temporaire, motif, durée, audité |

## Défense en profondeur

1. **Couche applicative** : chaque repository reçoit un `TenantContext` obligatoire (type non
   constructible hors du middleware) ; les requêtes filtrent par `tenant_id`.
2. **Couche base** : RLS `ENABLE` + `FORCE` sur les tables métier ; politique
   `tenant_id = current_setting('app.tenant_id', true)::uuid` ; `SET LOCAL app.tenant_id` au début de
   chaque transaction via le wrapper de transaction ; sans contexte, aucune ligne visible.
3. **Rôles** : `app_migrator` propriétaire ; `app_runtime`/`app_worker` sans `BYPASSRLS`, sans propriété,
   privilèges minimaux (pas d'UPDATE/DELETE sur les tables append-only).
4. **Contraintes** : FK composites `(tenant_id, x_id)` → impossible de rattacher un objet à un parent d'un
   autre tenant, même en cas de bug applicatif.
5. **Tests** : harnais générique qui, pour chaque table et chaque route, crée des données dans A et tente
   lecture/modification/suppression depuis B (API et SQL direct).
6. **Observabilité** : `tenant_id` (UUID non sensible) dans chaque log et trace ; alerte si une requête
   admin s'exécute sans contexte tenant.

## Tables globales (hors RLS tenant)

`tenant` (accès via rôle opérateur), `platform_user` (identité technique), `allergen` (référentiel),
`domain` (lecture publique limitée à la résolution), `webhook_event` (avant attribution), `feature_flag`.

## Accès support

`support_access_grant(operator_id, tenant_id, reason, scope, expires_at, approved_by)` ; durée maximale
par défaut 2 h ; chaque requête pendant l'accès est journalisée avec l'id du grant ; le propriétaire du
tenant voit ces accès dans son journal d'audit.

## Cycle de vie d'un tenant

Création (onboarding) → actif → restreint (impayé J+15 : plus de nouvelles commandes) → en résiliation
(lecture seule 30 j) → exporté → supprimé/anonymisé (données sans obligation de conservation) → les
sauvegardes expirent selon leur cycle. Export complet : CSV + JSON + médias d'origine, par tenant.
