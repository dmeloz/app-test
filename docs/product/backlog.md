# Backlog ordonné — 30 premiers jours

> Statut : PROPOSÉ. Hypothèse temps plein. Les tâches **[H]** sont humaines (non délégables à Claude).

## Semaine 1 — Validation et vérifications
1. **[H]** Relire et valider `scope-mvp.md`, les ADR 0001–0010 et 0013–0015, `open-decisions.md`.
2. **[H]** Protéger `main` sur GitHub (PR + CI obligatoires, pas de push forcé).
3. **[H]** Créer un compte Stripe plateforme en mode test (CH) ; vérifier dans la documentation et le
   tableau de bord : TWINT sur comptes connectés CH en direct charges, type de compte connecté, gestion
   des litiges et soldes négatifs. Consigner le résultat dans ADR 0005.
4. **[H]** Demander un devis à un juriste (CGV type restaurant, politique de confidentialité, contrat SaaS,
   DPA) et à une fiduciaire (TVA à l'emporter/livraison, reçus, pourboires).
5. **[H]** Lister 10 restaurants lausannois cibles et en contacter 5 pour un entretien/observation.
6. **[H]** Réserver le nom de domaine de la plateforme.
7. Opus : spec du lot L00 → validation humaine.

## Semaine 2 — L00 Socle technique
8. Sonnet : L00 (monorepo, outillage, Compose, CI, squelettes, health).
9. Opus : audit L00 → corrections → APPROVED → **[H]** fusion.
10. Opus : spec L01 (fondation DB + RLS) → **[H]** validation.

## Semaine 3 — L01 Fondation multi-tenant
11. Sonnet : L01 (rôles PG, migrations, tables tenant/restaurant/location/domain, RLS forcée, harnais d'isolation).
12. Opus : audit + security-opus → corrections → APPROVED → **[H]** fusion.
13. **[H]** Choisir le fournisseur OIDC (ADR 0009) ; Opus : spec L02.

## Semaine 4 — L02 Identité et autorisations
14. Sonnet : L02 (OIDC, sessions, MFA, memberships, RBAC, audit_log).
15. Opus : audit + security-opus → corrections.
16. Opus : bilan des 30 jours — charge réelle mesurée vs estimée, révision de `roadmap.md`.
17. **[H]** Entretiens restaurants : synthèse dans `personas-and-journeys.md`.

## Suivants (non planifiés)
L03 → L14 selon `roadmap.md`. Ordre révisable après les entretiens restaurants.
