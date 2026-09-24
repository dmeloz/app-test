import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    /** Identifiant de corrélation résolu par `registerCorrelationId` (en-tête reçu ou généré). */
    correlationId: string;
  }
}
