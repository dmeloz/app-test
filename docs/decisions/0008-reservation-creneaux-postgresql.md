# ADR 0008 — Réservation des créneaux en PostgreSQL

- **Statut** : Accepté (validé par le porteur le 2026-09-24) · **Date** : 2026-09-24

## Contexte
Le prompt suggère Redis pour les réservations temporaires. Or la réservation doit être atomique avec la
création de la commande, et ne jamais sur-vendre un créneau (deux clients, dernière place).

## Options
1. Compteurs dans `time_slot` + `slot_reservation` en PostgreSQL, incrément conditionnel en transaction.
2. Réservation Redis (TTL) + commande PostgreSQL.

## Décision
Option 1 : `UPDATE time_slot SET reserved_orders = reserved_orders + 1 … WHERE reserved_orders <
max_orders RETURNING` dans la transaction de création de commande ; CHECK en base ; expiration par le
worker (réservations `held` expirées → `released`, compteur décrémenté). Redis reste pour cache,
rate limiting et verrous courts non critiques.

## Conséquences
+ Aucune sur-réservation possible, même en cas de panne Redis. − Contention sur une ligne de créneau
aux pics : acceptable au volume visé (mesuré au test de charge).

## Réversibilité
Interface `CapacityService` ; le moteur V2 (points de charge, stations) s'ajoute derrière.
