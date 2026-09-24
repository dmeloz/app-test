// Fixture (M8, audit-1.md) : packages/domain ne dépend jamais d'un client Redis (ADR 0001) —
// motif explicitement listé par le constat.
// eslint-disable-next-line no-restricted-imports
import type Redis from "ioredis";
export type Unused = Redis;
