---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/test/**/*"
  - "**/tests/**/*"
  - "e2e/**/*"
---

# Règles de test

- Un résultat de test n'existe que s'il provient d'une commande réellement exécutée dont la sortie est
  citée. Ne jamais écrire « les tests passent » sans la sortie.
- Interdit : `.skip`, `.only`, `xit`, commenter un test, baisser un seuil de couverture ou désactiver un
  contrôle CI pour obtenir du vert.
- Unitaires (Vitest) sur `packages/domain` : prix, promotions, taxes, arrondis, capacité, machine à états,
  permissions, zones, disponibilités. Cas limites obligatoires : zéro, maximum, devise, arrondi, fuseau,
  changement d'heure, minuit.
- Intégration : PostgreSQL et Redis réels en conteneur (Testcontainers ou Compose), jamais de SQLite.
  Webhooks Stripe signés avec la clé de test, idempotence (double envoi), remboursements, migrations
  up puis down.
- Isolation multi-tenant : pour chaque ressource admin et publique, un test tente lecture, modification
  et suppression depuis le tenant B sur une donnée du tenant A, via l'API **et** directement en SQL avec le
  rôle `app_runtime` (vérifie la RLS).
- E2E (Playwright) : parcours critiques listés dans `docs/product/acceptance-criteria.md`.
- Données : fabriques synthétiques ; aucune donnée personnelle réelle ; horloge injectable.
- Assertions précises (valeurs exactes des montants) ; pas de snapshot pour des montants financiers.
