// Fixture (H1/M8) : packages/domain ne dépend jamais d'un SDK cloud (ADR 0001).
// eslint-disable-next-line no-restricted-imports
import type { S3Client } from "@aws-sdk/client-s3";
export type Unused = S3Client;
