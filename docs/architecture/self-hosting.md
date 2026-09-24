# Auto-hébergement (futur)

> Non commercialisable avant que toutes les conditions de la section « Pré-requis » soient remplies.

## Profils

```text
Développement              : Docker Compose local (PG, Redis, Mailpit, S3 dev via SeaweedFS)
Production gérée           : cloud en région suisse (services managés)
Production auto-hébergée   : conteneurs + PostgreSQL + Redis + stockage S3 + reverse proxy (TLS)
```

## Exigences de portabilité appliquées dès le L00

- Images OCI standard, non-root, sans état ; configuration uniquement par variables d'environnement
  validées au démarrage.
- PostgreSQL standard (extensions limitées à celles disponibles partout : `pgcrypto`, éventuellement
  `postgis` — à confirmer au L10 ; sinon géométrie simple en applicatif).
- Stockage via interface S3 (SeaweedFS en local — voir « Stockage S3 en développement » ci-dessous ;
  n'importe quel service compatible S3 convient en production auto-hébergée, MinIO inclus).
- Redis sans module propriétaire ; perte de Redis = dégradation (cache, rate limit), jamais perte de données.
- File d'attente dans PostgreSQL (outbox) : aucun service de file propriétaire requis.
- OIDC standard : tout fournisseur conforme (Zitadel/Keycloak auto-hébergeables).
- Observabilité via OpenTelemetry (backend interchangeable).
- IaC OpenTofu pour le profil géré ; Compose de référence pour le profil auto-hébergé.

## Stockage S3 en développement

- **Contexte (audit-1.md H4)** : `infra/docker/compose.yaml` épinglait initialement
  `minio/minio:RELEASE.2024-08-29T01-40-52Z`. Ce tag — et le dépôt `minio/minio` dans son ensemble —
  n'existe plus sur Docker Hub (`GET https://hub.docker.com/v2/repositories/minio/minio/` → HTTP 404,
  vérifié le 2026-09-24).
- **Première correction, rejetée par l'audit 2 (H4)** : `localstack/localstack:2026.08.4` avait été
  retenu, mais l'audit 2 a constaté que cette image est en réalité **LocalStack Pro** : le dépôt
  communautaire est archivé et l'usage sans compte/jeton n'est plus possible pour cette version —
  le healthcheck déclaré ne correspondait de toute façon pas à l'image réellement épinglée. Ce choix
  a été abandonné.
- **Choix retenu (arbitrage du fil principal, `docs/lots/L00-socle/audit-2.md`, section
  « Arbitrage Opus sur H4 », 2026-09-24)** : **SeaweedFS**, image officielle `chrislusf/seaweedfs`
  (`is_automated: true`, `is_private: false`, vérifié via
  `GET https://hub.docker.com/v2/repositories/chrislusf/seaweedfs/`), **licence Apache-2.0** (vérifiée
  dans le fichier `LICENSE` du dépôt source, `raw.githubusercontent.com/seaweedfs/seaweedfs/master/LICENSE`
  → en-tête « Apache License, Version 2.0 »), S3-compatible, sans compte ni jeton, également
  utilisable en auto-hébergement futur (cohérent avec le tableau des profils ci-dessus).
  - **Tag et digest** : `4.47` — dernière version stable au 2026-09-24, déterminée en énumérant les
    tags du dépôt (`GET /v2/repositories/chrislusf/seaweedfs/tags?...&ordering=-name`, filtrés sur les
    noms commençant par un chiffre pour écarter les tags de signature `sha256-*.sig` générés par
    `cosign`) : `4.47` est le plus récent (`last_pushed` 2026-09-14), au-dessus de `4.46`, `4.45`, etc.
    Digest de l'index multi-architecture confirmé par deux sources concordantes : (1)
    `GET /v2/repositories/chrislusf/seaweedfs/tags/4.47` → champ `digest`
    `sha256:ce9e796f1fe6f06968f4c04bdaf8f678dad9c8acdfef3d244133d71bfa6bf882` ; (2) manifeste brut
    téléchargé directement sur le registre (`registry-1.docker.io`, jeton anonyme
    `auth.docker.io/token?service=registry.docker.io&scope=repository:chrislusf/seaweedfs:pull`) et
    son `sha256sum` calculé localement — **identique octet pour octet** au digest ci-dessus. Image
    `linux/amd64` (celle utilisée par ce compose) : `sha256:f83509b0721dfd8e2e07faf76c0a899f67a8a889c89abe2fa0a5227ba1320362`.
    `compose.yaml` épingle `chrislusf/seaweedfs:4.47@sha256:ce9e796f1fe6f06968f4c04bdaf8f678dad9c8acdfef3d244133d71bfa6bf882`
    (tag en commentaire pour la lisibilité, digest pour la garantie d'intégrité — cohérent avec L5).
  - **Entrepoint et commande** : lus dans la configuration OCI de l'image (blob de config récupéré
    par digest sur le registre) : `Entrypoint: ["/entrypoint.sh"]`, `Cmd: ["mini", "-dir=/data"]`.
    Le script `docker/entrypoint.sh` du dépôt source (consulté le 2026-09-24) confirme que le
    sous-commande `mini` lance `/usr/bin/weed mini -dir=/data`. `weed/command/mini.go` (même dépôt)
    montre que le mode « mini » est **le mode officiellement recommandé par le projet pour l'usage S3
    en développement** (`Short: "start a complete SeaweedFS setup optimized for S3 beginners and
    small/dev use cases"`) et **active le serveur S3 par défaut** (`miniEnableS3 = cmdMini.Flag.Bool("s3", true, ...)`,
    port par défaut `8333`, cohérent avec `ExposedPorts["8333/tcp"]` dans la config de l'image) : ce
    mode remplit l'équivalent fonctionnel de « `server -s3` » évoqué par l'arbitrage, sans avoir à
    surcharger la commande de l'image (reprise explicitement dans `compose.yaml` pour la lisibilité).
    Alternative équivalente si le mode « mini » devait être écarté à l'avenir : `weed server -s3`
    (flag `-s3` du sous-commande `server`, vérifié dans `weed/command/server.go`).
  - **Healthcheck** : `curl -fsS http://127.0.0.1:9333/healthz`. Le port `9333` est celui du serveur
    « master » intégré au mode « mini » (`miniMasterOptions.port` par défaut `9333`, vérifié dans
    `weed/command/mini.go`) ; sa route `/healthz` (`weed/server/master_server.go`) est une liveness
    pure (« Keep this fast and simple », `w.WriteHeader(http.StatusOK)`, aucune dépendance à l'état du
    cluster ou du leader — à la différence de `/readyz`). Présence du binaire `curl` **vérifiée dans
    le Dockerfile source de l'image** (`raw.githubusercontent.com/seaweedfs/seaweedfs/master/docker/Dockerfile.go_build`,
    stage final : `RUN apk upgrade --no-cache && apk add --no-cache fuse curl su-exec libgcc
    libcrypto3 libssl3 && addgroup ... seaweed && adduser ... seaweed`) — jamais supposé.
  - **Utilisateur** : l'image démarre en `root` (aucun `USER` dans le Dockerfile final) mais
    `entrypoint.sh` détecte `id -u = 0` et relance le même processus via `su-exec seaweed` (uid/gid
    1000) avant d'exécuter `weed` — le service tourne donc en non-root une fois démarré, comme les
    autres services de ce fichier.
  - **Alternatives évaluées et écartées** :
    - `bitnami/minio` : dépôt toujours présent mais **0 tag public** (image devenue payante,
      « Bitnami Secure Images », depuis 2025) — impossible à épingler.
    - `adobe/s3mock` : Dockerfile non localisable publiquement pour vérifier le binaire de contrôle
      de santé — écarté par prudence plutôt que de deviner un binaire.
    - `quay.io/minio/minio` : `quay.io` reste bloqué par la politique réseau de cet environnement.
    - `versity/versitygw` (alternative proposée par l'arbitrage en cas de problème avec SeaweedFS) :
      **non retenue, SeaweedFS n'ayant posé aucun problème vérifié** (image publique, tag et digest
      résolus, entrypoint/commande et healthcheck confirmés par lecture directe de la configuration
      de l'image et du code source amont).
- **Non revérifié par exécution réelle** : le démon Docker n'est pas exploitable dans le bac à sable
  de cette passe (comme pour les autres services) — `docker compose up -d --wait` (4 services
  `healthy`, dont ce service `s3`) reste à confirmer par la CI ou un humain avant fusion.
- **Écart par rapport à la spécification** : `docs/lots/L00-socle/spec.md` nomme MinIO explicitement
  (§2, AC-L00-03). Le remplacement (MinIO → LocalStack → SeaweedFS) est une conséquence directe et
  documentée des constats H4 successifs (indisponibilité de l'image, puis nature « Pro » du
  remplacement), pas un choix de confort ; le contrat fonctionnel (stockage compatible S3, non-root,
  épinglé par digest, healthcheck fonctionnel, licence permissive) est préservé. Le choix sera
  réexaminé avec l'ADR 0012 pour la production (cf. arbitrage).

## Pré-requis avant toute offre commerciale

Procédure d'installation reproductible · mises à jour signées · politique de versions supportées ·
sauvegardes automatisées · monitoring · durcissement système · rotation des secrets · stratégie de haute
disponibilité · responsable d'astreinte · tests de restauration et de reprise · licence et contrat
spécifiques (droit commercial séparé).
