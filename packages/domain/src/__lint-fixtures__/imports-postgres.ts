// Fixture (M8, audit-1.md) : packages/domain ne dépend jamais d'un pilote de base de données
// (ADR 0001) — motif explicitement listé par le constat, distinct de `pg`.
// eslint-disable-next-line no-restricted-imports
import type { Sql } from "postgres";
export type Unused = Sql;
