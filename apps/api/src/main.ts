import "reflect-metadata";
import { createApp } from "./app.js";
import { log } from "./common/logger/json-logger.js";
import { ConfigValidationError, loadConfig } from "./config/env.schema.js";

function loadConfigOrExit(): ReturnType<typeof loadConfig> {
  try {
    return loadConfig();
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      // AC-L00-05 : message clair, jamais la valeur fournie.
      log("fatal", "Configuration invalide au démarrage de l'API", { reason: error.message });
      process.exit(1);
    }
    throw error;
  }
}

async function bootstrap(): Promise<void> {
  const config = loadConfigOrExit();

  const app = await createApp(config);

  await app.listen(config.PORT, config.HOST);
  log("info", "API démarrée", { port: config.PORT, host: config.HOST, nodeEnv: config.NODE_ENV });
}

bootstrap().catch((error: unknown) => {
  log("fatal", "Échec du démarrage de l'API", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
