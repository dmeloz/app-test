import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Intégration réelle (M7, audit-1.md) : `app.enableShutdownHooks()` (apps/api/src/app.ts) doit se
 * traduire par un arrêt propre et rapide du binaire `dist/main.js` réellement exécuté (pas un test
 * unitaire sur un objet Nest en mémoire) à la réception de SIGTERM — condition nécessaire à un
 * arrêt de conteneur sans dépassement du délai de grâce Docker (par défaut 10 s ; ce test exige
 * bien moins : < 2 s).
 *
 * Suppose `pnpm --filter api build` déjà exécuté (voir `apps/api/turbo.json` implicite via la
 * tâche racine `apps/api#test`, qui dépend de son propre `build` — même convention que
 * `worker.integration.test.ts`).
 */
const apiDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mainEntry = path.join(apiDir, "dist", "main.js");
const PORT = 4123;

describe("main.js (processus réel) — arrêt sur SIGTERM (M7)", () => {
  let child: ReturnType<typeof spawn>;
  let stdout: string;

  beforeAll(async () => {
    child = spawn(process.execPath, [mainEntry], {
      cwd: apiDir,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(PORT),
        HOST: "127.0.0.1",
        LOG_LEVEL: "info",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    stdout = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("API non démarrée à temps")), 5000);
      const check = setInterval(() => {
        if (stdout.includes("API démarrée")) {
          clearInterval(check);
          clearTimeout(timeout);
          resolve();
        }
      }, 20);
    });
  });

  afterAll(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  });

  it("répond 200 sur /health/live avant l'arrêt", async () => {
    const response = await fetch(`http://127.0.0.1:${PORT}/health/live`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("s'arrête proprement (code 0, sans signal) en moins de 2 s sur SIGTERM", async () => {
    const start = Date.now();
    const exitPromise = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
      (resolve) => {
        child.once("exit", (code, signal) => resolve({ code, signal }));
      },
    );
    child.kill("SIGTERM");
    const { code, signal } = await exitPromise;
    const durationMs = Date.now() - start;

    expect(durationMs).toBeLessThan(2000);
    expect(code).toBe(0);
    expect(signal).toBeNull();
  });
});
