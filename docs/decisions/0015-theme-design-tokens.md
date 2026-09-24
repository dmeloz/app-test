# ADR 0015 — Personnalisation par design tokens, sans fork

- **Statut** : Proposé · **Date** : 2026-09-24

## Décision
- Thème = document JSON validé (couleurs sémantiques, typographies parmi une liste contrôlée, rayons,
  ombres, espacements, densité, composition de page, blocs activables) converti en variables CSS.
- Composants communs dans `packages/ui` ; aucune CSS/JS arbitraire fournie par un tenant.
- Contraste AA calculé à la publication (blocage si échec) ; versionnement et prévisualisation.
- Demande hors système de thème = prestation premium produisant un composant/variant réutilisable.

## Conséquences
+ Une seule base de code, accessibilité garantie, sécurité (pas d'injection de style/script).
− Liberté graphique bornée (assumé).

## Réversibilité
Élevée : ajout de tokens/compositions sans migration des thèmes existants (valeurs par défaut).
