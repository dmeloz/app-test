# ADR 0014 — Montants, taxes et snapshots

- **Statut** : Proposé · **Date** : 2026-09-24

## Décision
- Montants en entiers `bigint` dans la plus petite unité (centimes) + `currency` ISO 4217 ; type
  `Money` dans `packages/domain` interdisant les opérations entre devises différentes.
- Taux de taxe en points de base ; TVA suisse traitée en prix TTC (prix affichés TTC), ventilation
  HT/TVA/TTC calculée par ligne avec règle d'arrondi unique documentée et testée.
- Arrondi à 0,05 CHF : **question ouverte pour la fiduciaire** (paiements électroniques au centime
  possibles) ; règle paramétrable par profil fiscal.
- Profil fiscal versionné (établissement, pays, date d'effet), validé par la fiduciaire ; code de taxe par
  produit et par frais ; règles par canal (retrait, livraison ; sur place non utilisé au MVP).
- Snapshot immuable dans la commande : lignes, options, prix, taux, libellés, zone, frais, profil fiscal.

## Risques
Erreur d'arrondi cumulée → tests de propriétés (somme des lignes = total) ; changement de taux → nouvelle
version de profil, jamais rétroactif.

## Réversibilité
Élevée pour les règles (données) ; faible pour le format des montants (choix définitif volontaire).
