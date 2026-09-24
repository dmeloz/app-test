# Auto-hébergement (futur)

> Non commercialisable avant que toutes les conditions de la section « Pré-requis » soient remplies.

## Profils

```text
Développement              : Docker Compose local (PG, Redis, Mailpit, S3 dev via LocalStack)
Production gérée           : cloud en région suisse (services managés)
Production auto-hébergée   : conteneurs + PostgreSQL + Redis + stockage S3 + reverse proxy (TLS)
```

## Exigences de portabilité appliquées dès le L00

- Images OCI standard, non-root, sans état ; configuration uniquement par variables d'environnement
  validées au démarrage.
- PostgreSQL standard (extensions limitées à celles disponibles partout : `pgcrypto`, éventuellement
  `postgis` — à confirmer au L10 ; sinon géométrie simple en applicatif).
- Stockage via interface S3 (LocalStack en local — voir « Stockage S3 en développement » ci-dessous ;
  n'importe quel service compatible S3 convient en production auto-hébergée, MinIO inclus).
- Redis sans module propriétaire ; perte de Redis = dégradation (cache, rate limit), jamais perte de données.
- File d'attente dans PostgreSQL (outbox) : aucun service de file propriétaire requis.
- OIDC standard : tout fournisseur conforme (Zitadel/Keycloak auto-hébergeables).
- Observabilité via OpenTelemetry (backend interchangeable).
- IaC OpenTofu pour le profil géré ; Compose de référence pour le profil auto-hébergé.

## Stockage S3 en développement

- **Contexte (audit-1.md, constat H4)** : `infra/docker/compose.yaml` épinglait
  `minio/minio:RELEASE.2024-08-29T01-40-52Z`. Ce tag — et le dépôt `minio/minio` dans son ensemble —
  n'existe plus sur Docker Hub (`GET https://hub.docker.com/v2/repositories/minio/minio/` → HTTP 404,
  vérifié le 2026-09-24 ; recherche `hub.docker.com/v2/search/repositories/?query=minio` ne renvoie
  que des miroirs tiers non officiels, écartés pour raison de confiance de la chaîne
  d'approvisionnement). `docker compose up` échouait donc systématiquement pour ce service.
- **Choix retenu** : `localstack/localstack:2026.08.4`, restreint au service S3 uniquement
  (`SERVICES: s3`). LocalStack est un projet open source activement maintenu (publications
  quasi quotidiennes) fournissant une émulation d'API AWS, dont S3, utilisable en local sans compte
  cloud.
- **Vérification de l'existence du tag** (API du registre, méthode identique aux autres images de ce
  fichier) : `GET https://hub.docker.com/v2/repositories/localstack/localstack/tags/2026.08.4` → HTTP
  200, `last_pushed` 2026-09-23, image `amd64`/`arm64` présentes. Alternatives évaluées et écartées :
  - `bitnami/minio` : dépôt toujours présent mais **0 tag public** (image devenue payante,
    « Bitnami Secure Images », depuis 2025) — impossible à épingler.
  - `adobe/s3mock` (tag `5.2.3`, vérifié disponible) : plus proche en taille de MinIO, mais son
    Dockerfile n'a pas pu être localisé publiquement pour vérifier la présence d'un binaire de
    contrôle de santé (chemin non trouvé sur `raw.githubusercontent.com/adobe/S3Mock`) — écarté par
    prudence plutôt que de deviner un binaire, comme demandé par l'audit.
  - `quay.io/minio/minio` : hors de portée technique pendant cette passe (le registre `quay.io` est
    bloqué par la politique réseau de l'environnement d'exécution de l'agent — 403 sur `CONNECT`) ;
    à réévaluer par un humain si MinIO reste souhaité.
- **Healthcheck** : réutilise la commande `HEALTHCHECK` officielle de l'image amont
  (`/opt/code/localstack/.venv/bin/localstack status services --format=json`), copiée telle quelle
  depuis le `Dockerfile` public du projet
  (`raw.githubusercontent.com/localstack/localstack/master/Dockerfile`, consulté le 2026-09-24 :
  stage `base` → `FROM python:3.13.12-slim-trixie`, `curl` installé et jamais retiré dans le stage
  final, `HEALTHCHECK` défini avec exactement ce chemin). Binaire confirmé présent par lecture du
  code source amont ; **non revérifié par exécution réelle** du conteneur (démon Docker indisponible
  dans le bac à sable de cette passe — `docker compose up -d --wait` reste à faire par la CI ou un
  humain, cf. `implementation-report.md`).
- **Écart par rapport à la spécification** : `docs/lots/L00-socle/spec.md` nomme MinIO explicitement
  (§2, AC-L00-03). Le remplacement est une conséquence directe et documentée du constat H4
  (indisponibilité totale de l'image), pas un choix de confort ; le contrat fonctionnel (stockage
  compatible S3, non-root, épinglé, healthcheck fonctionnel) est préservé. Validation humaine
  suggérée si MinIO doit être restauré via une autre source (auto-construction depuis les sources
  MinIO, ou `quay.io` une fois accessible).

## Pré-requis avant toute offre commerciale

Procédure d'installation reproductible · mises à jour signées · politique de versions supportées ·
sauvegardes automatisées · monitoring · durcissement système · rotation des secrets · stratégie de haute
disponibilité · responsable d'astreinte · tests de restauration et de reprise · licence et contrat
spécifiques (droit commercial séparé).
