# Feuille de route et estimation de charge

> **Estimations, pas des engagements.** Hypothèse : un développeur seul (le porteur) à temps plein,
> assisté par Claude (Opus pour cadrage/audit, Sonnet pour l'implémentation). « Semaine » = semaine
> équivalent temps plein (ETP). À mi-temps, multiplier par ~2. Confiance faible tant que les lots
> L00–L02 n'ont pas été réalisés et mesurés : réviser l'estimation après L02.

## Phases

| Phase | Contenu | Charge estimée | Dépendances externes |
|---|---|---|---|
| 1 — Cadrage et validation | Ce dossier, ADR, vérifications Stripe/TWINT, devis juriste, recherche pilote | 1–3 sem. | Réponses du porteur, Stripe, juriste |
| 2 — Pilote exploitable | Lots L00 à L14 ci-dessous | **22–36 sem.** | Pilote, compte Stripe du restaurant, menu, fiduciaire, juriste |
| 3 — Stabilisation SaaS | Domaines perso + TLS, promotions, Web Push, SMS, impression réseau, facturation SaaS, onboarding outillé | 10–16 sem. | Fournisseurs SMS/e-mail, matériel imprimante |
| 4 — Commercialisation CH | Thèmes, FR/EN stabilisés, 1re caisse, contrats, pentest, page de statut | 8–14 sem. + externes | Pentest externe, juriste, partenaire caisse |
| 5 — Europe (par pays) | Revue légale/fiscale, EUR, TVA locale, moyens de paiement, langue | 6–12 sem. / pays | Juriste et fiscaliste locaux |

**Écart avec le prompt maître** : l'estimation « 12–16 semaines pour une petite équipe expérimentée » ne
s'applique pas à un développeur seul. Pour viser ~16 semaines, appliquer l'ordre de simplification du
prompt (déjà intégré dans `scope-mvp.md`) et réduire encore : livraison par code postal uniquement,
un seul thème, pas de PWA hors ligne au pilote.

## Lots de la phase 2 (ordre recommandé)

| Lot | Contenu | Critique | Charge |
|---|---|---|---|
| L00 | Socle : monorepo pnpm/Turborepo, TS strict, lint/format, Vitest, Playwright, Compose (PG, Redis, Mailpit, MinIO), CI GitHub Actions (sans déploiement), squelettes des 3 apps, `/health` | non | 1–1,5 |
| P01 | Maquette cliquable de démonstration (4 écrans, données fictives, aucun paiement) — pour démarcher un pilote | non | 1–1,5 |
| L01 | Fondation DB : rôles PG, Drizzle, migrations, tenant/restaurant/location/domain, RLS forcée, contexte transactionnel, harnais de tests d'isolation | **oui** | 1,5–2,5 |
| L02 | Identité personnel : OIDC, sessions, MFA obligatoire par rôle, memberships, RBAC, réauthentification, `audit_log` | **oui** | 1,5–2,5 |
| L03 | Restaurant et établissement : coordonnées, horaires, fermetures exceptionnelles, canaux, pause | non | 1–1,5 |
| L04 | Catalogue et menu : produits, variantes, options, allergènes, origines, brouillon/publication/versions, rupture | oui (allergènes) | 2–3 |
| L05 | Site public : résolution par sous-domaine, thème v0 (tokens, contraste), i18n FR/EN, SEO de base, pages légales, PWA de base | non | 2–3 |
| L06 | Disponibilités, créneaux, capacité, réservation temporaire (PostgreSQL) | **oui** | 1,5–2,5 |
| L07 | Panier, devis serveur, pricing, taxes (profil fiscal versionné), snapshots | **oui** | 1,5–2,5 |
| L08 | Checkout, Stripe Connect (onboarding + direct charges), TWINT, webhooks, idempotence | **oui** | 2–3 |
| L09 | Commandes : machines à états, back-office de service temps réel, alertes, ticket imprimable | **oui** | 2–3 |
| L10 | Livraison : zones (rayon, code postal), adresses, géocodage via port, statuts livraison | oui | 1,5–2 |
| L11 | Remboursements (plafonds, approbation), litiges (rattachement), rapprochement | **oui** | 1–2 |
| L12 | Notifications e-mail bilingues via outbox, journal d'envoi, dédup | non | 1–1,5 |
| L13 | Reporting, export CSV, observabilité (OTel, alertes), sauvegardes + test de restauration, staging | **oui** | 1,5–2,5 |
| L14 | Durcissement, e2e complet, revue security-opus globale, recette pilote | **oui** | 1,5–2 |
| | **Total phase 2** | | **23–37,5** |
