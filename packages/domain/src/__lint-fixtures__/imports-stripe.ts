// Fixture (M8, audit-1.md) : packages/domain ne dépend jamais du SDK d'un fournisseur de paiement
// (ADR 0001, `.claude/rules/architecture.md` : port/adaptateur, jamais le SDK dans le domaine) —
// motif explicitement listé par le constat.
// eslint-disable-next-line no-restricted-imports
import type Stripe from "stripe";
export type Unused = Stripe;
