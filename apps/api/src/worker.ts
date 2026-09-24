import "reflect-metadata";
import { fileURLToPath } from "node:url";
import { log } from "./common/logger/json-logger.js";
import { ConfigValidationError, loadConfig } from "./config/env.schema.js";

/**
 * Point d'entrée du worker (effets de bord asynchrones — outbox, etc.). Au lot L00 : boucle vide,
 * aucune tâche ; démarre et s'arrête proprement sur SIGTERM/SIGINT (exclu de ce lot : Redis, outbox).
 */
function loadConfigOrExit(): ReturnType<typeof loadConfig> {
  try {
    return loadConfig();
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      log("fatal", "Configuration invalide au démarrage du worker", { reason: error.message });
      process.exit(1);
    }
    throw error;
  }
}

export async function runWorker(signals: NodeJS.Process = process): Promise<void> {
  const config = loadConfigOrExit();
  log("info", "Worker démarré (boucle vide, aucune tâche au lot L00)", {
    nodeEnv: config.NODE_ENV,
  });

  await new Promise<void>((resolve) => {
    // M3 (audit-1.md) : s'abonner à un signal ne suffit pas à empêcher Node de sortir — sans
    // aucun handle actif, la boucle d'événements se vide dès que la promesse ci-dessous devient la
    // seule chose en attente, et le process quitte immédiatement (constaté : EXIT=0 après ~120 ms,
    // avant même la réception d'un signal). Un minuteur répété (jamais déclenché en pratique, la
    // durée est volontairement hors bornes) maintient le process vivant jusqu'à l'arrêt demandé.
    const keepAlive = setInterval(() => {}, 2_147_483_647);
    const shutdown = (signal: string): void => {
      clearInterval(keepAlive);
      log("info", "Worker arrêté", { signal });
      resolve();
    };
    signals.once("SIGTERM", () => shutdown("SIGTERM"));
    signals.once("SIGINT", () => shutdown("SIGINT"));
  });
}

// Ce bloc n'est exercé par aucun test Vitest (qui importe `runWorker` directement, jamais ce
// fichier comme point d'entrée) : il est couvert par `apps/api/test/worker.integration.test.ts`,
// qui exécute `dist/worker.js` dans un processus enfant réel (H7, audit-1.md — le commentaire
// précédent affirmait à tort l'existence de ce test).
const isMainModule =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  runWorker()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      log("fatal", "Échec du worker", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    });
}
