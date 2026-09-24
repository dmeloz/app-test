import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
// L'augmentation de type `FastifyRequest.correlationId` vient de `./fastify.d.ts`
// (inclus automatiquement par le programme TypeScript, pas d'import nécessaire).

export const CORRELATION_ID_HEADER = "x-correlation-id";

const MAX_CORRELATION_ID_LENGTH = 128;

// L7 (audit-1.md) : format restreint (alphanumérique + `.`, `_`, `:`, `-`), pas seulement une
// longueur maximale — un en-tête client mal formé (espaces, retours ligne, caractères de contrôle)
// ne doit jamais se retrouver tel quel dans les logs ou l'en-tête de réponse.
const CORRELATION_ID_PATTERN = new RegExp(`^[A-Za-z0-9._:-]{1,${MAX_CORRELATION_ID_LENGTH}}$`);

function isValidCorrelationId(value: unknown): value is string {
  return typeof value === "string" && CORRELATION_ID_PATTERN.test(value);
}

type HeaderValue = string | string[] | undefined;

/** Réutilise la valeur d'un en-tête `x-correlation-id` si elle est valide, sinon en génère une. */
export function resolveCorrelationId(header: HeaderValue): string {
  const provided = Array.isArray(header) ? header[0] : header;
  return isValidCorrelationId(provided) ? provided : randomUUID();
}

/** Réutilise l'en-tête `x-correlation-id` fourni par le client s'il est valide, sinon en génère un. */
export function extractOrGenerateCorrelationId(request: FastifyRequest): string {
  return resolveCorrelationId(request.headers[CORRELATION_ID_HEADER] as HeaderValue);
}

/**
 * Enregistre un hook Fastify global (`onRequest`) qui attache le `correlationId` déjà résolu par
 * Fastify (`genReqId`, voir `app.ts`) à la requête et le renvoie dans l'en-tête de réponse
 * (AC-L00-06). Le logger par requête (`request.log`) porte déjà ce même identifiant sous le libellé
 * `correlationId` grâce à `requestIdLogLabel` (H2) : aucun reconfiguration du logger n'est
 * nécessaire ici.
 */
export function registerCorrelationId(instance: FastifyInstance): void {
  instance.addHook("onRequest", (request, reply, done) => {
    request.correlationId = request.id;
    // Conserve la compatibilité avec le code qui lit encore l'en-tête brut (ex. filtre d'erreurs).
    request.headers[CORRELATION_ID_HEADER] = request.id;
    void reply.header(CORRELATION_ID_HEADER, request.id);
    done();
  });
}
