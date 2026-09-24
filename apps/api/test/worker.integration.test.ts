import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Intégration réelle (M3, audit-1.md) : `worker.test.ts` prouve seulement que `runWorker` résout sa
 * promesse quand on lui injecte un faux `EventEmitter` — il ne détecte pas qu'un vrai process Node
 * quitte immédiatement faute de handle actif dans la boucle d'événements (constaté par l'audit :
 * EXIT=0 après ~118 ms, avant tout signal). Ce test exécute le binaire réellement buildé
 * (`dist/worker.js`) dans un processus enfant, sans jamais lui envoyer de signal avant d'avoir
 * vérifié qu'il est toujours vivant.
 *
 * Suppose `pnpm --filter api build` déjà exécuté (comme pour les autres tests d'intégration légers
 * de ce lot, qui s'appuient sur du code déjà compilé/chargé — voir `apps/api/turbo.json`, tâche
 * `apps/api#test` : dépend désormais de son propre `build`).
 */
const apiDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workerEntry = path.join(apiDir, "dist", "worker.js");

describe("worker.js (processus réel)", () => {
  let child: ReturnType<typeof spawn>;
  let stdout: string;
  let exitCode: number | null;
  let exitSignal: NodeJS.Signals | null;

  beforeAll(async () => {
    child = spawn(process.execPath, [workerEntry], {
      cwd: apiDir,
      env: { ...process.env, NODE_ENV: "test" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    stdout = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    // Laisse passer largement plus que le délai observé par l'audit (~118 ms) avant de vérifier
    // que le process est toujours vivant — sans lui envoyer le moindre signal entre-temps.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  });

  it("reste vivant au moins 1 s sans recevoir de signal", () => {
    expect(child.exitCode).toBeNull();
    expect(child.signalCode).toBeNull();
    expect(stdout).toContain("Worker démarré");
  });

  it("s'arrête proprement (code 0) sur SIGTERM", async () => {
    const exitPromise = new Promise<void>((resolve) => {
      child.once("exit", (code, signal) => {
        exitCode = code;
        exitSignal = signal;
        resolve();
      });
    });
    child.kill("SIGTERM");
    await exitPromise;

    expect(exitCode).toBe(0);
    expect(exitSignal).toBeNull();
    expect(stdout).toContain("Worker arrêté");
  });
});
