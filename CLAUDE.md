# CLAUDE.md — SaaS de commande directe pour restaurants

> Fichier chargé à chaque session. Rester sous 200 lignes. Les règles détaillées vivent dans `.claude/rules/`
> (chargées selon les fichiers travaillés) et les décisions dans `docs/decisions/`.
> Source complète du besoin : `docs/reference/prompt-maitre.md`.

## Vision

SaaS multi-tenant permettant à chaque restaurant d'avoir son propre site de commande (retrait, livraison
interne) à son image, sans commission : abonnement fixe. Le restaurant est le vendeur légal (merchant of
record) ; la plateforme fournit la technologie. Marché initial : Suisse (FR/EN, CHF), extension UE pays par pays.

## État du projet

- **Phase : gate 0 → 1 franchi le 2026-09-24** (cadrage validé). Seul le lot L00 est débloqué, et
  uniquement après validation de sa spec (`docs/lots/L00-socle/spec.md`). Voir `docs/process/gates.md`.
- L'ancien fichier de test `bonjour.html` a été retiré à la demande du porteur (2026-09-24) ; le dépôt
  est entièrement dédié à ce SaaS.

## Décisions validées (résumé — détail dans `docs/product/scope-mvp.md` et les ADR)

- Monolithe modulaire TypeScript, PWA mobile-first, pas d'app native, pas de microservices ni Kubernetes.
- Retrait et livraison activables séparément ; livraison désactivée si aucun moyen de livraison.
- Personnalisation complète par thème (design tokens), jamais par fork.
- Paiement : compte PSP du restaurant (Stripe Connect, direct charges), abonnement SaaS facturé à part.
- Hébergement initial en région suisse quand raisonnable ; auto-hébergement futur possible sans réécriture.
- Alcool modélisé mais désactivé ; pourboire désactivé ; onboarding accompagné ; fiscalité configurable.

## Architecture (ADR acceptés le 2026-09-24 ; 0005, 0009, 0011, 0012 encore ouverts)

```
apps/storefront   Next.js (App Router) — site public multi-domaine + PWA
apps/backoffice   Next.js (App Router) — back-office personnel
apps/api          NestJS + Fastify — API REST /v1, webhooks, workers (entrée séparée)
packages/domain   logique métier pure (prix, taxes, états, capacité) — sans framework
packages/contracts schémas Zod partagés + OpenAPI
packages/db       schéma Drizzle, migrations SQL, politiques RLS, seeds synthétiques
packages/ui       design system + moteur de thème (tokens CSS)
infra/            Docker Compose (dev/self-host) + OpenTofu (cloud)
```

## Commandes (créées au lot L00)

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm typecheck
pnpm test            # unitaires
pnpm test:int        # intégration (PostgreSQL/Redis en conteneur)
pnpm test:tenancy    # isolation multi-tenant
pnpm test:e2e        # Playwright
pnpm build
docker compose -f infra/docker/compose.yaml up -d
```

## Règles non négociables

1. Aucun montant calculé par le navigateur n'est accepté : le serveur recalcule tout.
2. Montants en entiers (plus petite unité) + code ISO de devise, toujours.
3. Jamais de donnée de carte : Stripe Checkout/Elements uniquement.
4. Ne jamais faire confiance à un `tenant_id` venant du client : résolu serveur (domaine, session).
5. RLS PostgreSQL en défense en profondeur ; l'application se connecte avec un rôle non propriétaire.
6. Toute opération critique est idempotente ; tout webhook est signé, horodaté, dédupliqué.
7. Toute modification sensible est auditée (`AuditLog`).
8. Les commandes conservent un snapshot immuable (produits, options, prix, taxes, libellés, zone, frais).
9. Migrations destructives : sauvegarde + stratégie + retour arrière documentés, validation humaine.
10. Aucune information allergène générée ou déduite sans validation humaine du restaurant.
11. Aucun déploiement production, fusion sur `main`, push forcé ou réécriture d'historique par un agent.
12. Ne jamais supprimer une fonction existante sans demande explicite.
13. Ne jamais inventer un résultat de commande ou de test : seules les sorties réellement exécutées comptent.
14. Signaler explicitement : fait vérifié / hypothèse / estimation / décision à valider.
15. Aucune donnée personnelle réelle en dev/test ; aucun secret lu, copié ou commité.

## Workflow Opus / Sonnet (détail : `docs/process/workflow-lots.md`)

```
OPUS : analyser et spécifier (docs/lots/<lot>/spec.md)
  ↓
HUMAIN : valider la spec                          ← Sonnet ne commence jamais avant
  ↓
SONNET (agent developer-sonnet) : coder, migrer, tester, documenter, builder
  ↓
OPUS (agents auditor-opus / security-opus) : auditer le diff et les preuves
  ↓
SONNET : corriger tous les BLOCKER et HIGH
  ↓
OPUS : contre-audit → APPROVED
  ↓
HUMAIN : fusion / déploiement
```

- Le fil principal (Opus) garde la vision, arbitre, et délègue l'implémentation à `developer-sonnet`.
- Aucun modèle ne s'auto-approuve sur un lot critique (liste dans `docs/process/workflow-lots.md`).
- Chaque sous-agent reçoit une tâche étroite : fichiers concernés + critères d'acceptation.
- Toute décision durable est écrite (ADR ou spec de lot), jamais seulement dans la conversation.

## Définition de terminé (résumé)

Critères d'acceptation satisfaits · typecheck, lint, tests unitaires/intégration/e2e critiques verts ·
build de production OK · migrations testées + rollback documenté · isolation multi-tenant prouvée ·
logs/métriques présents · docs à jour · aucun secret exposé · aucun BLOCKER/HIGH ouvert ·
verdict Opus `APPROVED` · autorisation humaine de fusion. Détail : `docs/process/definition-of-done.md`.

## Git

- Travailler sur une branche de fonctionnalité ; jamais directement sur `main`.
- Pas de `push --force`, pas de `rebase` d'une branche partagée, pas de désactivation de test.
- Messages de commit clairs, en français, décrivant le lot.

## Documents de référence

- Produit : `docs/product/` (vision, périmètre MVP, parcours, stories, critères, roadmap, backlog)
- Architecture : `docs/architecture/` · Sécurité : `docs/security/` · Conformité : `docs/compliance/`
- Exploitation : `docs/operations/` · Coûts : `docs/finance/` · Décisions : `docs/decisions/`
- Processus : `docs/process/` (workflow, gates, DoD, gabarits de spec et d'audit)
