# Déploiement

> Statut : PROPOSÉ. **Aucune affirmation de disponibilité régionale ci-dessous n'a été vérifiée** : chaque
> composant et sous-traitant doit être vérifié dans la documentation officielle du fournisseur avant
> l'ADR 0012 définitif.

## Environnements

| Env. | Usage | Base | Stripe | Domaines | Données |
|---|---|---|---|---|---|
| development | Poste local, Docker Compose | PG local | mode test (compte dev) | `*.localhost` | synthétiques |
| test | CI (conteneurs éphémères) | PG conteneur | stripe-mock / signatures de test | — | synthétiques |
| staging | Recette, démo, tests e2e réels | PG géré (petite instance) | mode test | `*.staging.<plateforme>` | synthétiques |
| production | Restaurants réels | PG géré, PITR | mode live | `*.<plateforme>` + domaines clients | réelles |

Chaque environnement a ses propres secrets, webhooks, clés de notification et comptes PSP.

## Composants de production (profil géré)

Conteneurs : `storefront`, `backoffice`, `api`, `worker` (même image que `api`, autre commande) ·
PostgreSQL géré (PITR, chiffrement, réplica optionnel) · Redis géré · stockage objet S3 · coffre de
secrets · CDN + WAF · observabilité (OTel collector → backend) · e-mail transactionnel · DNS.

## Comparaison d'hébergeurs (à compléter et vérifier — ADR 0012)

| Critère | Azure Switzerland North | AWS eu-central-2 (Zurich) | Hébergeur suisse (ex. Infomaniak, Exoscale) |
|---|---|---|---|
| PostgreSQL géré avec PITR en CH | à vérifier | à vérifier | à vérifier |
| Redis géré en CH | à vérifier | à vérifier | à vérifier |
| Conteneurs managés en CH | à vérifier | à vérifier | à vérifier |
| Stockage S3 compatible en CH | à vérifier | à vérifier | à vérifier |
| CDN/WAF (points de présence, résidence des logs) | à vérifier | à vérifier | à vérifier |
| Coût mensuel pilote estimé | à chiffrer | à chiffrer | à chiffrer |
| Réversibilité (standards ouverts) | bonne si services standards | bonne si services standards | bonne |
| Complexité d'exploitation solo | moyenne | élevée | faible à moyenne |
| Soumission éventuelle à des lois extraterritoriales (CLOUD Act) | à analyser (juriste) | à analyser | plus faible (à confirmer) |

**Recommandation provisoire** : privilégier la simplicité d'exploitation pour un développeur seul et des
services strictement standards (PostgreSQL, Redis, S3, OCI), puis trancher sur le coût chiffré et la
disponibilité vérifiée. Décision attendue avant le staging (L13), pas avant.

## Pipeline CI/CD (GitHub Actions)

`install --frozen-lockfile` → format → lint → typecheck → unitaires → intégration (services PG/Redis) →
isolation tenant → gitleaks (secrets) → audit dépendances → build → e2e critiques → image OCI → scan
d'image (Trivy ou équivalent) → SBOM (CycloneDX/Syft) → déploiement staging → smoke tests →
**approbation humaine (environnement protégé GitHub)** → production progressive → vérification
post-déploiement → rollback (image précédente ; migrations expand/contract compatibles N-1).

## Migrations en production

Expand/contract : ajout compatible → déploiement du code → migration de données → retrait différé.
Migration exécutée par un job dédié avec le rôle `app_migrator`, après sauvegarde vérifiée, jamais par
un agent. Rollback applicatif toujours possible vers N-1.

## Sauvegardes (proposition)

PITR 35 jours · sauvegarde logique quotidienne chiffrée vers un stockage isolé (autre fournisseur ou
compte, immuable) · mensuelles 12 mois · test de restauration trimestriel documenté · RPO ≤ 5 min (PITR),
RTO ≤ 4 h au pilote (à valider).
