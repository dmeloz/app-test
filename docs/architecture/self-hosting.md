# Auto-hébergement (futur)

> Non commercialisable avant que toutes les conditions de la section « Pré-requis » soient remplies.

## Profils

```text
Développement              : Docker Compose local (PG, Redis, Mailpit, MinIO)
Production gérée           : cloud en région suisse (services managés)
Production auto-hébergée   : conteneurs + PostgreSQL + Redis + stockage S3 + reverse proxy (TLS)
```

## Exigences de portabilité appliquées dès le L00

- Images OCI standard, non-root, sans état ; configuration uniquement par variables d'environnement
  validées au démarrage.
- PostgreSQL standard (extensions limitées à celles disponibles partout : `pgcrypto`, éventuellement
  `postgis` — à confirmer au L10 ; sinon géométrie simple en applicatif).
- Stockage via interface S3 (MinIO en local).
- Redis sans module propriétaire ; perte de Redis = dégradation (cache, rate limit), jamais perte de données.
- File d'attente dans PostgreSQL (outbox) : aucun service de file propriétaire requis.
- OIDC standard : tout fournisseur conforme (Zitadel/Keycloak auto-hébergeables).
- Observabilité via OpenTelemetry (backend interchangeable).
- IaC OpenTofu pour le profil géré ; Compose de référence pour le profil auto-hébergé.

## Pré-requis avant toute offre commerciale

Procédure d'installation reproductible · mises à jour signées · politique de versions supportées ·
sauvegardes automatisées · monitoring · durcissement système · rotation des secrets · stratégie de haute
disponibilité · responsable d'astreinte · tests de restauration et de reprise · licence et contrat
spécifiques (droit commercial séparé).
