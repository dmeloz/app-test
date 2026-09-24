# ADR 0006 — États opérationnel et financier de la commande séparés

- **Statut** : Accepté (validé par le porteur le 2026-09-24) · **Date** : 2026-09-24

## Contexte
La liste d'états du prompt maître mélange cycle opérationnel (`IN_PREPARATION`, `READY`…) et financier
(`PAID`, `REFUND_PENDING`, `PARTIALLY_REFUNDED`…), alors que le même prompt exige leur séparation. Une
commande peut être `COMPLETED` **et** `PARTIALLY_REFUNDED`.

## Options
1. Une seule machine à 16 états. 2. Deux machines : `op_status` et `fin_status`.

## Décision
Option 2 (tables de transitions dans `docs/architecture/payment-flow.md`). Transitions déclarées dans
`packages/domain`, testées exhaustivement (toutes paires from→to), historisées dans `order_transition`.
`DRAFT` correspond au panier (pas d'ordre persistant avant checkout).

## Conséquences
+ Pas d'explosion combinatoire, remboursements possibles à tout moment, rapports clairs.
− Règles de cohérence entre machines (ex. `PENDING_ACCEPTANCE` exige `PAID`) → invariants testés.

## Réversibilité
Une vue SQL peut exposer un état combiné pour les exports si besoin.
