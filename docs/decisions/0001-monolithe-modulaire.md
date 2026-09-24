# ADR 0001 — Monolithe modulaire TypeScript

- **Statut** : Accepté (validé par le porteur le 2026-09-24) · **Date** : 2026-09-24

## Contexte
Un développeur seul, un pilote à atteindre vite, des exigences fortes de transactions (commande +
paiement + capacité) et d'auto-hébergement futur.

## Options
1. Monolithe modulaire (une API NestJS, un worker, deux frontends).
2. Microservices (commande, paiement, catalogue…).
3. Backend-as-a-Service (Supabase/Firebase) + fonctions.

## Décision
Option 1. Modules à frontières explicites (`index.ts` public), domaine pur dans `packages/domain`,
ports/adaptateurs pour les fournisseurs, API et worker issus de la même image.

## Conséquences
+ Transactions ACID locales (commande/réservation/outbox), un seul déploiement, débogage simple.
+ Auto-hébergement trivial (4 conteneurs + PG + Redis + S3).
− Discipline nécessaire pour éviter le couplage ; contrôle par règle de lint d'imports.

## Risques
Érosion des frontières → règle ESLint `no-restricted-imports`/`boundaries` dès L00 ; audit Opus.

## Réversibilité
Un module à frontières propres peut être extrait en service plus tard (ses ports existent déjà).
L'option 3 serait difficile à quitter (verrouillage) — écartée.
