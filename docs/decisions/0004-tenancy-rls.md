# ADR 0004 — Multi-tenancy : schéma partagé, `tenant_id`, RLS forcée

- **Statut** : Accepté (validé par le porteur le 2026-09-24) · **Date** : 2026-09-24

## Contexte
Isolation stricte exigée, dizaines puis centaines de tenants, coût minimal, auto-hébergement.

## Options
1. Schéma partagé + `tenant_id` + filtre applicatif + RLS forcée.
2. Un schéma PostgreSQL par tenant.
3. Une base par tenant.

## Décision
Option 1 (détail : `docs/architecture/tenancy.md`). RLS `FORCE`, rôle applicatif non propriétaire et
sans `BYPASSRLS`, FK composites, harnais de tests d'isolation obligatoire pour chaque table et route.

## Conséquences
+ Migrations uniques, coût faible, requêtes transverses opérateur possibles (rôle dédié).
− Tout oubli de contexte = aucune ligne (sécurité par défaut) mais bugs à diagnostiquer ; coût RLS faible
  à indexer (`tenant_id` en tête des index).

## Risques
Politique RLS erronée ; connexion avec le mauvais rôle ; pooler de connexions réutilisant un contexte →
`SET LOCAL` uniquement (portée transaction), jamais `SET` de session ; test dédié.

## Réversibilité
Un tenant peut être extrait vers une base dédiée (export par `tenant_id`) pour un client premium ou
l'auto-hébergement.
