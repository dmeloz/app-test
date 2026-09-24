# Architecture Decision Records

Format : contexte · options · décision · conséquences · risques · réversibilité. Statuts : `Proposé`,
`Accepté`, `Remplacé par ADR-xxxx`, `Rejeté`. Un ADR `Proposé` n'autorise aucune implémentation.

| ADR | Titre | Statut |
|---|---|---|
| [0001](0001-monolithe-modulaire.md) | Monolithe modulaire TypeScript | Accepté |
| [0002](0002-monorepo-pnpm-turborepo.md) | Monorepo pnpm + Turborepo | Accepté |
| [0003](0003-orm-drizzle.md) | Accès aux données : Drizzle + migrations SQL | Accepté |
| [0004](0004-tenancy-rls.md) | Multi-tenancy : schéma partagé + RLS forcée | Accepté |
| [0005](0005-stripe-connect-direct-charges.md) | Paiement : Stripe Connect direct charges | Proposé (vérification requise) |
| [0006](0006-etats-commande-separes.md) | États opérationnel et financier séparés | Accepté |
| [0007](0007-outbox-postgresql.md) | Asynchrone : outbox PostgreSQL | Accepté |
| [0008](0008-reservation-creneaux-postgresql.md) | Réservation des créneaux en PostgreSQL | Accepté |
| [0009](0009-identite-oidc.md) | Identité : OIDC pour le personnel, invités pour les clients | Proposé (fournisseur à choisir) |
| [0010](0010-deux-apps-nextjs.md) | Deux applications Next.js | Accepté |
| [0011](0011-domaines-tls.md) | Domaines personnalisés et TLS | Proposé (après pilote) |
| [0012](0012-hebergement.md) | Hébergement initial | Ouvert |
| [0013](0013-orchestration-agents.md) | Orchestration Opus/Sonnet et garde-fous | Accepté |
| [0014](0014-montants-taxes-snapshots.md) | Montants, taxes et snapshots | Accepté |
| [0015](0015-theme-design-tokens.md) | Personnalisation par design tokens | Accepté |
