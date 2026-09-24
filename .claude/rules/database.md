---
paths:
  - "packages/db/**/*"
  - "**/*.sql"
  - "**/migrations/**/*"
---

# Règles base de données (PostgreSQL + Drizzle)

- Clés primaires UUID v7 (ordonnées) ; identifiants publics séparés, aléatoires et non prédictibles.
- `tenant_id NOT NULL` sur toute table métier scoped ; clés étrangères composites `(tenant_id, id)`
  lorsque la relation doit rester dans le même tenant ; contraintes uniques incluant `tenant_id`.
- RLS activée **et forcée** (`ENABLE` + `FORCE ROW LEVEL SECURITY`) sur les tables sensibles, politique
  basée sur `current_setting('app.tenant_id', true)`. Le contexte est posé par `SET LOCAL` dans chaque
  transaction. Le rôle applicatif n'est ni propriétaire des tables ni `BYPASSRLS`.
- Trois rôles : `app_migrator` (propriétaire, migrations uniquement), `app_runtime` (API), `app_worker`
  (workers, RLS aussi). Un test d'intégration échoue si `app_runtime` possède `BYPASSRLS` ou une table.
- Montants : `bigint` en plus petite unité + colonne `currency char(3)` ; jamais de `float`/`numeric` pour
  un montant stocké. Taux de taxe en points de base (`integer`, 810 = 8,10 %).
- Horodatages `timestamptz` en UTC ; fuseau de l'établissement stocké (`Europe/Zurich`).
- Migrations en SQL relu, versionnées, avec script de retour arrière ou justification d'irréversibilité.
  Migration destructive (DROP, changement de type, suppression de données) : procédure expand/contract,
  sauvegarde vérifiée, validation humaine. Jamais exécutée par un agent hors base locale de test.
- Tables d'événements (`order_transition`, `audit_log`, `webhook_event`, snapshots) : append-only ;
  UPDATE/DELETE révoqués pour `app_runtime`.
- Chaque table documente : cardinalités, index, champs chiffrés, durée de conservation, stratégie de
  suppression (dans `docs/architecture/data-model.md`).
- Seeds : données synthétiques uniquement.
