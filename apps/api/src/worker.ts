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
    const shutdown = (signal: string): void => {
      log("info", "Worker arrêté", { signal });
      resolve();
    };
    signals.once("SIGTERM", () => shutdown("SIGTERM"));
    signals.once("SIGINT", () => shutdown("SIGINT"));
  });
}

/* c8 ignore start -- point d'entrée process, couvert par un test d'intégration (spawn + signal). */
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
/* c8 ignore stop */
