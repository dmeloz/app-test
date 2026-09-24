// Fixture (H1/M8) : packages/domain ne dépend jamais d'un pilote de base de données (ADR 0001).
// eslint-disable-next-line no-restricted-imports
import type { Client } from "pg";
export type Unused = Client;
