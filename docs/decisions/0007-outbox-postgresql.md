# ADR 0007 — Traitements asynchrones : outbox PostgreSQL

- **Statut** : Proposé · **Date** : 2026-09-24

## Contexte
E-mails, impressions, notifications temps réel, intégrations et traitement des webhooks doivent être
fiables (aucune perte si l'API redémarre), dédupliqués et rejouables.

## Options
1. Outbox transactionnelle en PostgreSQL + worker (implémentation maison simple ou bibliothèque type
   pg-boss / graphile-worker — à choisir au L12).
2. BullMQ sur Redis (npm 6.3.8).
3. File managée du cloud (SQS, Service Bus…).

## Décision
Option 1 : le message est écrit dans la même transaction que le changement métier (pas de double
écriture incohérente), Redis reste non critique, aucun service propriétaire (auto-hébergement).
`LISTEN/NOTIFY` pour la latence, polling de secours, `FOR UPDATE SKIP LOCKED`, retry exponentiel,
dead-letter visible.

## Conséquences
+ Cohérence transactionnelle, portabilité. − Charge sur PostgreSQL (faible au volume visé : 20–80
commandes/jour/restaurant).

## Risques
Croissance de la table → purge des messages traités après 30 jours ; index sur `(status, next_attempt_at)`.

## Réversibilité
Le worker lit une interface `Queue` ; passage à BullMQ ou une file managée sans toucher le domaine.
