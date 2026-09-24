// Fixture (H1) : packages/domain doit rester pur — aucune dépendance à un framework (ADR 0001).
// eslint-disable-next-line no-restricted-imports
import type { Injectable } from "@nestjs/common";
export type Unused = typeof Injectable;
