import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
// L'augmentation de type `FastifyRequest.correlationId` vient de `./fastify.d.ts`
// (inclus automatiquement par le programme TypeScript, pas d'import nécessaire).

export const CORRELATION_ID_HEADER = "x-correlation-id";

const MAX_CORRELATION_ID_LENGTH = 128;

function isValidCorrelationId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_CORRELATION_ID_LENGTH;
}

/** Réutilise l'en-tête `x-correlation-id` fourni par le client s'il est valide, sinon en génère un. */
export function extractOrGenerateCorrelationId(request: FastifyRequest): string {
  const header = request.headers[CORRELATION_ID_HEADER];
  const provided = Array.isArray(header) ? header[0] : header;
  return isValidCorrelationId(provided) ? provided : randomUUID();
}

/**
 * Enregistre un hook Fastify global (`onRequest`) qui : résout le `correlationId`, l'attache à la
 * requête et au logger (JSON structuré), et le renvoie dans l'en-tête de réponse (AC-L00-06).
 */
export function registerCorrelationId(instance: FastifyInstance): void {
  instance.addHook("onRequest", (request, reply, done) => {
    const correlationId = extractOrGenerateCorrelationId(request);
    request.headers[CORRELATION_ID_HEADER] = correlationId;
    request.correlationId = correlationId;
    request.log = request.log.child({ correlationId });
    void reply.header(CORRELATION_ID_HEADER, correlationId);
    done();
  });
}
