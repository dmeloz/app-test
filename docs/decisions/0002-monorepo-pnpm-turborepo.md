# ADR 0002 — Monorepo pnpm + Turborepo

- **Statut** : Proposé · **Date** : 2026-09-24

## Contexte
3 applications et ~7 packages partagés (domaine, contrats, db, ui, i18n, config, testing).

## Options
1. pnpm workspaces + Turborepo (turbo 2.11.3 sur npm au 2026-09-24).
2. pnpm workspaces + Nx (nx 23.2.1).
3. pnpm workspaces seuls.

## Décision
Option 1 : Turborepo apporte cache et orchestration des tâches avec une configuration minimale
(`turbo.json`) ; Nx est plus puissant (générateurs, graphes, contraintes) mais plus lourd à maîtriser
seul. Les frontières de modules sont contrôlées par ESLint plutôt que par Nx.

## Conséquences
+ Configuration courte, courbe d'apprentissage faible. − Moins d'outils de contrainte intégrés.

## Risques
Cache distant payant si utilisé → non requis (cache local + cache CI GitHub).

## Réversibilité
Élevée : Nx peut être ajouté au-dessus des workspaces pnpm sans restructurer.
