---
paths:
  - "apps/api/src/modules/customer/**/*"
  - "apps/api/src/modules/consent/**/*"
  - "apps/api/src/modules/notification/**/*"
  - "apps/api/src/modules/reporting/**/*"
  - "apps/api/src/modules/support/**/*"
  - "docs/compliance/**/*"
---

# Règles de protection des données (LPD / RGPD)

- Minimisation : ne collecter que ce qui est nécessaire à la commande ; chaque champ personnel a une
  finalité et une durée de conservation documentées (`docs/compliance/privacy-and-legal.md`).
- Identité technique globale uniquement pour l'authentification ; profil commercial, historique et
  consentements isolés par tenant. Un restaurant ne voit jamais l'activité d'un client ailleurs.
- Consentement marketing séparé, facultatif, par restaurant, versionné et révocable ; jamais présélectionné.
- Droits des personnes (accès, rectification, export, opposition, suppression) : via `DataSubjectRequest`,
  traçables, dans les délais légaux.
- Suppression : anonymisation des commandes à conserver pour la comptabilité ; les sauvegardes expirent
  selon leur cycle documenté (pas de promesse de suppression immédiate).
- Aucune donnée personnelle dans les logs, métriques, traces, messages d'erreur ou tickets de support.
- Accès support : temporaire, explicite, limité à un tenant, audité.
- Ce cadrage n'est pas un avis juridique : toute règle légale est marquée « à valider par juriste ».
