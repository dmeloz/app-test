// Fixture (N9, audit-2.md) : packages/domain ne dépend jamais de node:module (createRequire
// contournerait la liste d'autorisation et la règle no-restricted-syntax sur import()).
// eslint-disable-next-line no-restricted-imports
import { createRequire } from "node:module";
export const unused = createRequire;
