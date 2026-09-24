# ADR 0010 — Deux applications Next.js (site public / back-office)

- **Statut** : Accepté (validé par le porteur le 2026-09-24) · **Date** : 2026-09-24

## Contexte
Le site public est servi sur des domaines arbitraires de clients, cacheable, PWA ; le back-office est
authentifié, sensible, temps réel.

## Options
1. Une application Next.js pour tout. 2. Deux applications (`storefront`, `backoffice`) partageant `packages/ui`.

## Décision
Option 2 : cookies, CSP, en-têtes, surface d'attaque et cycles de déploiement séparés ; le back-office
n'est jamais servi sur un domaine client ; le storefront n'embarque aucun code d'administration.

## Conséquences
+ Sécurité et cache plus simples. − Deux builds ; code partagé via packages.

## Réversibilité
Fusion possible plus tard (App Router, route groups) si le coût de maintenance le justifie.
