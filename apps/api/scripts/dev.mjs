#!/usr/bin/env node
// Mode développement de l'API/worker (H6 + M4, audit-1.md).
//
// - `tsx` (esbuild) n'émet pas les métadonnées de décorateurs (`emitDecoratorMetadata`) dont NestJS
//   a besoin pour résoudre par type les dépendances injectées sans jeton `@Inject` explicite
//   (voir `apps/api/src/modules/health/health.service.ts`, ajouté comme garde-fou concret) : on
//   compile avec le vrai compilateur TypeScript (`tsc`) et on exécute la sortie compilée.
// - `node --watch` redémarre automatiquement dès que `tsc -w` réécrit un fichier de `dist/`.
// - `.env` n'est jamais chargé implicitement : `--env-file-if-exists` le charge explicitement s'il
//   existe (fichier ignoré par git, jamais committé).
//
// Usage : node scripts/dev.mjs <main|worker>
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.dirname(path.dirname(apiDir));
const envFile = path.join(repoRoot, ".env");
const tscBin = path.join(repoRoot, "node_modules", ".bin", "tsc");

const entry = process.argv[2] === "worker" ? "worker" : "main";
const distEntry = path.join(apiDir, "dist", `${entry}.js`);

// 1. Premier build complet et bloquant : garantit que `dist/<entry>.js` existe avant de démarrer
//    `node --watch` sur ce fichier (sinon MODULE_NOT_FOUND immédiat, avant le premier passage de
//    `tsc -w`, qui n'écrit sa sortie qu'après un court délai).
const initialBuild = spawnSync(tscBin, ["-p", "tsconfig.build.json"], {
  cwd: apiDir,
  stdio: "inherit",
});
if (initialBuild.status !== 0) {
  process.exit(initialBuild.status ?? 1);
}

// 2. Recompilation continue + exécution avec redémarrage automatique.
const children = [
  spawn(tscBin, ["-w", "-p", "tsconfig.build.json", "--preserveWatchOutput"], {
    cwd: apiDir,
    stdio: "inherit",
  }),
  spawn(process.execPath, ["--watch", `--env-file-if-exists=${envFile}`, distEntry], {
    cwd: apiDir,
    stdio: "inherit",
  }),
];

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

let remaining = children.length;
for (const child of children) {
  child.on("exit", () => {
    remaining -= 1;
    // Si l'un des deux processus s'arrête seul (ex. erreur de compilation fatale), on arrête
    // l'autre pour ne laisser aucun processus résiduel.
    shutdown("SIGTERM");
    if (remaining === 0) {
      process.exit(0);
    }
  });
}
