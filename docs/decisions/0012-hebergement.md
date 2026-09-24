# ADR 0012 — Hébergement initial

- **Statut** : **Ouvert** — décision avant staging (L13) · **Date** : 2026-09-24

## Contexte
Préférence pour une région suisse, coût minimal, exploitation par une seule personne, réversibilité.

## Options
Azure Switzerland North · AWS eu-central-2 (Zurich) · hébergeurs suisses/européens (ex. Infomaniak,
Exoscale) · combinaison (PaaS simple + PG géré).

## Critères
Services disponibles **dans la région** (vérifiés composant par composant : conteneurs, PG avec PITR,
Redis, S3, secrets, CDN/WAF, logs) · coût mensuel chiffré pilote et à 20 restaurants · sauvegardes
isolées · résidence des données et des sous-traitants · réversibilité · compétences d'exploitation ·
analyse juridique des transferts (à faire par un juriste).

## Décision
Aucune à ce stade. Tableau comparatif dans `docs/architecture/deployment.md` à compléter avec des sources
datées. Contrainte dès maintenant : n'utiliser que des interfaces standards (OCI, PostgreSQL, Redis, S3, OTel).

## Réversibilité
Visée élevée grâce aux contraintes de portabilité (`self-hosting.md`).
