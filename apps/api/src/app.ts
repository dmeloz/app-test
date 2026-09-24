import type { IncomingMessage } from "node:http";
import type { Writable } from "node:stream";
import helmet from "@fastify/helmet";
import { ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { LogController } from "fastify";
import { AppModule } from "./app.module.js";
import {
  CORRELATION_ID_HEADER,
  registerCorrelationId,
  resolveCorrelationId,
} from "./common/correlation/correlation.js";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter.js";
import type { AppConfig } from "./config/env.schema.js";

export interface CreateAppOptions {
  /**
   * Flux d'écriture à utiliser à la place de `stdout` pour les logs Fastify/pino — réservé aux
   * tests (M5) : permet de capturer les lignes de log en mémoire sans toucher la console.
   */
  logger?: Writable;
}

/**
 * Construit l'application Nest/Fastify entièrement configurée (adaptateur, corrélation, sécurité,
 * filtre d'erreurs, logs JSON), partagée par `main.ts` et les tests d'intégration (M5,
 * audit-1.md) — évite que les tests recâblent l'application à la main et divergent du vrai
 * bootstrap. N'ouvre aucun port réseau (`app.listen` reste à la charge de l'appelant).
 */
export async function createApp(
  config: AppConfig,
  { logger: loggerStream }: CreateAppOptions = {},
): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    logger: {
      level: config.LOG_LEVEL,
      ...(loggerStream ? { stream: loggerStream } : {}),
    },
    // H2 : l'en-tête de corrélation devient l'identifiant de requête Fastify lui-même — généré
    // avant même le premier hook, et déjà présent (sous le libellé `correlationId`, pas `reqId`)
    // sur *toutes* les lignes de log Fastify/pino de la requête ("incoming request",
    // "request completed"), y compris celles émises avant que `registerCorrelationId` ne
    // s'exécute (audit-1.md, constat H2). `logController` (pas le `requestIdLogLabel` racine,
    // déprécié depuis Fastify 5.12) porte ce même libellé.
    //
    // Important : ne PAS utiliser l'option `requestIdHeader` de Fastify — elle court-circuite
    // `genReqId` en reprenant l'en-tête brut du client tel quel (`req.headers[header] || genReqId(req)`,
    // voir `fastify/lib/req-id-gen-factory.js`), ce qui réintroduirait la faille L7 (format non
    // validé). `genReqId` seul lit et valide l'en-tête lui-même via `resolveCorrelationId`.
    logController: new LogController({ requestIdLogLabel: "correlationId" }),
    genReqId: (request: IncomingMessage) =>
      resolveCorrelationId(request.headers[CORRELATION_ID_HEADER]),
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(config),
    adapter,
    {
      bufferLogs: true,
      // H2 : logs internes Nest (bootstrap, `Logger` applicatif, filtre d'erreurs) en JSON structuré
      // — plus de texte coloré. `flattenParams` place les champs structurés (ex. `correlationId`) à
      // la racine de l'objet JSON plutôt que sous une clé `params` imbriquée.
      logger: new ConsoleLogger({ json: true, flattenParams: true }),
    },
  );

  registerCorrelationId(adapter.getInstance());
  await app.register(helmet);
  app.useGlobalFilters(new GlobalExceptionFilter());
  // M7 (audit-1.md) : `useProcessExit: true` fait sortir le process par `process.exit(0)` une fois
  // le nettoyage terminé (hooks `onApplicationShutdown`, fermeture du serveur Fastify), plutôt que
  // le comportement par défaut de Nest qui se ré-envoie le signal reçu (`process.kill(pid, signal)`)
  // — ce dernier fait sortir le process AVEC le signal (code de sortie 128+n, ex. 143 pour SIGTERM),
  // ambigu pour un orchestrateur (indiscernable d'un arrêt non propre). `process.exit()` garantit
  // aussi que l'évènement `exit` est émis à temps pour vider les journaux (recommandation officielle
  // NestJS, pertinente ici avec le logger Fastify/pino asynchrone).
  app.enableShutdownHooks(undefined, { useProcessExit: true });

  return app;
}
