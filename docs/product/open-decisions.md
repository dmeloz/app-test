# Hypothèses, contradictions et décisions à valider

## Décisions humaines — bloquantes pour le lot L00

| # | Décision | Recommandation Opus | Impact si non tranchée |
|---|---|---|---|
| D1 | Monorepo : Turborepo ou Nx | **Turborepo** (ADR 0002) | Bloque L00 |
| D2 | ORM : Drizzle ou Prisma | **Drizzle + migrations SQL relues** (ADR 0003) | Bloque L01 (L00 peut démarrer) |
| D3 | File persistante : outbox PostgreSQL ou BullMQ/Redis | **Outbox PostgreSQL + worker** (ADR 0007) | Bloque L01/L12 |
| D4 | Deux apps Next.js (public / back-office) ou une seule | **Deux apps** (ADR 0010) | Bloque L00 |
| D5 | Séparer état opérationnel et financier des commandes | **Oui** (ADR 0006) | Bloque L09, influence L01 |
| D6 | Périmètre pilote resserré | **Oui** (`scope-mvp.md`) | Bloque la planification |

## Décisions humaines — bloquantes plus tard

| # | Décision | Avant | Recommandation |
|---|---|---|---|
| D7 | Fournisseur OIDC personnel | L02 | Zitadel (open source, auto-hébergeable) ; alternatives Keycloak, Auth0, Entra ID. Vérifier la région d'hébergement. |
| D8 | Hébergeur initial | staging (L13) | Comparaison ADR 0012 ; décision après chiffrage réel |
| D9 | Validation TWINT + direct charges | L08 | Vérification humaine documentée (gate) |
| D10 | Fournisseur e-mail transactionnel | L12 | Critères : région UE/CH, DKIM par domaine restaurant, coût |
| D11 | Géocodage / cartographie | L10 | Critères : couverture CH, coût, conditions de stockage des coordonnées ; mode manuel obligatoire |
| D12 | Plafonds de remboursement par rôle | L11 | Défaut proposé : employé 0, manager CHF 50 par commande, propriétaire illimité avec réauth |
| D13 | Politique d'annulation client | L09 | Politique progressive du prompt, configurable, à valider par juriste |
| D14 | Durées de conservation | L13 | Proposition dans `privacy-and-legal.md`, validation juriste/fiduciaire |
| D15 | Paiement au retrait | après pilote | Modélisé, désactivé |
| D16 | Niveau de support soir/week-end | pilote | Couverture critique pendant les services du pilote par le porteur |

## Questions ouvertes du prompt maître — impact si sans réponse

| Question | Hypothèse retenue | Impact |
|---|---|---|
| Budget pilote | Coûts fixes minimaux ; plafonds par service (`docs/finance/operating-costs.md`) | Choix hébergeur, SMS |
| Premier restaurant pilote | Restaurant lausannois standard (hypothèse) | Risque de sur/sous-concevoir menus et capacité |
| Pays UE suivant | Non choisi ; EUR et i18n préparés | Aucun avant phase 5 |
| Première caisse | Aucune ; export CSV + impression | Aucun avant phase 4 |
| Fournisseur d'identité | Voir D7 | Bloque L02 |
| Seuils de remboursement | Voir D12 | Bloque L11 |
| Prestataire livraison externe | Aucun ; port préparé | Aucun au pilote |
| Rétention comptable | 10 ans pour pièces comptables du restaurant (à valider) | Stratégie de suppression |

## Contradictions et risques détectés dans le prompt maître

1. **Stripe Connect en phase 3 alors que le paiement est en phase 2** — si le pilote encaisse sur le
   compte plateforme, la plateforme devient de fait le vendeur/encaisseur (contraire au modèle légal
   validé, et risque réglementaire). → Connect direct charges **dès le pilote** (ADR 0005).
2. **États de commande mêlant opérationnel et financier** (`PAID`, `REFUND_PENDING`, `PARTIALLY_REFUNDED`
   dans la même machine que `IN_PREPARATION`) alors que le prompt exige « état financier et opérationnel
   séparés ». Une commande peut être `COMPLETED` et `PARTIALLY_REFUNDED`. → deux machines (ADR 0006).
3. **Redis pour les réservations temporaires de créneaux** : une réservation doit être atomique avec la
   création de la commande ; Redis n'est pas transactionnel avec PostgreSQL. → réservations en
   PostgreSQL avec contrainte de capacité (ADR 0008) ; Redis pour cache, rate limiting, verrous courts.
4. **Promotions** dans le périmètre MVP mais en phase 3 dans la feuille de route. → après pilote.
5. **Web Push et SMS** dans les notifications MVP mais en phase 3. → après pilote.
6. **Route `/v1/restaurants/{id}/slots`** utilise un `id` alors que les autres routes publiques utilisent
   `{slug}`. → uniformiser sur `{slug}` (ou mieux, résolution par domaine) (`api-contracts.md`).
7. **Un seul Next.js pour site public et back-office** : mêmes cookies/CSP/surface d'attaque pour des
   domaines clients arbitraires et l'administration. → deux apps (ADR 0010).
8. **Délai 12–16 semaines** pour une équipe ; le porteur est seul. → 22–36 semaines ETP estimées.
9. **Prisma 8 en release candidate** au 2026-09-24 (npm : `8.0.0-rc.15`) ; Drizzle toujours en 0.x
   (`0.45.3`). Aucun des deux n'est « stable 1.0+ récent » sans nuance → ADR 0003.
10. **TypeScript 7.0** (compilateur natif) publié récemment (npm : `7.0.2`) : compatibilité NestJS
    (décorateurs, métadonnées) et outillage à vérifier au L00 ; repli sur la dernière 6.x/5.x si besoin.
11. **Domaines personnalisés** : exigent l'émission automatique de certificats TLS et la preuve DNS ;
    composant d'infrastructure non trivial absent de la stack. → ADR 0011, après pilote.
12. **Frontmatter des sous-agents** : le prompt demande `permissionMode: plan` pour les auditeurs ; ce mode
    risque de bloquer l'exécution des vérifications (tests, lint). → `permissionMode: default` avec
    `disallowedTools: Edit, Write` (auditeur en lecture seule mais capable de rejouer les tests).
13. **Identifiants de modèle** : les fichiers d'agents utilisent les alias `opus` / `sonnet` (acceptés par
    Claude Code). Pour figer une version, remplacer par l'identifiant complet — voir `docs/process/workflow-lots.md`.
