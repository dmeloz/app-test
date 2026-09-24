// Fixture (H1/M8) : packages/domain ne dépend jamais d'une file d'attente (ADR 0001).
// eslint-disable-next-line no-restricted-imports
import type { Queue } from "bullmq";
export type Unused = Queue;
