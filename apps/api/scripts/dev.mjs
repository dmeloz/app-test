#!/usr/bin/env node
// Mode développement de l'API/worker (H6 + M4, audit-1.md ; N6, audit-2.md).
//
// - `tsx` (esbuild) n'émet pas les métadonnées de décorateurs (`emitDecoratorMetadata`) dont NestJS
//   a besoin pour résoudre par type les dépendances injectées sans jeton `@Inject` explicite
//   (voir `apps/api/src/modules/health/health.service.ts`, ajouté comme garde-fou concret) : on
//   compile avec le vrai compilateur TypeScript (`tsc`) et on exécute la sortie compilée.
// - Ce script surveille lui-même `dist/` et redémarre le processus applicatif à chaque recompilation
//   de `tsc -w` (voir N6 ci-dessous pour la raison : **pas** `node --watch`).
// - `.env` n'est jamais chargé implicitement : `--env-file-if-exists` le charge explicitement s'il
//   existe (fichier ignoré par git, jamais committé).
//
// Usage : node scripts/dev.mjs <main|worker>
import { spawn, spawnSync } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.dirname(path.dirname(apiDir));
const envFile = path.join(repoRoot, ".env");
const tscBin = path.join(repoRoot, "node_modules", ".bin", "tsc");

const entry = process.argv[2] === "worker" ? "worker" : "main";
const distDir = path.join(apiDir, "dist");
const distEntry = path.join(distDir, `${entry}.js`);

// 1. Premier build complet et bloquant : garantit que `dist/<entry>.js` existe avant de démarrer le
//    processus applicatif (sinon MODULE_NOT_FOUND immédiat, avant le premier passage de `tsc -w`,
//    qui n'écrit sa sortie qu'après un court délai).
const initialBuild = spawnSync(tscBin, ["-p", "tsconfig.build.json"], {
  cwd: apiDir,
  stdio: "inherit",
});
if (initialBuild.status !== 0) {
  process.exit(initialBuild.status ?? 1);
}

// 2. Recompilation continue (tsc -w) : redémarrage sur changement géré nous-mêmes ci-dessous, pas
//    par `node --watch`.
//
// N6 (audit-2.md) : `node --watch` plantait de façon fiable et reproductible avec une assertion
// native (« Assertion failed: (wrap) != nullptr » dans `FSEventWrap::GetInitialized`,
// `node:internal/fs/watchers`) dès qu'il recevait SIGINT **ou** SIGTERM après quelques secondes de
// surveillance active de `dist/<entry>.js` — testé isolément, sans second signal concurrent, avec et
// sans groupe de processus partagé, avec et sans `detached` : reproductible dans tous les cas sur
// cet environnement (Node 24.21.0), donc un bug du mode `--watch` lui-même sur ce chemin de code
// (`node:internal/main/watch_mode` → `FSWatcher.close`), pas seulement un problème de double
// livraison de signal comme initialement diagnostiqué. Plutôt que de dépendre d'un mode
// expérimental fragile, ce script implémente son propre redémarrage : `fs.watch(dist/, { recursive:
// true })` (surveillance de notre fait, jamais arrêtée par un signal du système) déclenche le
// redémarrage du processus applicatif que nous gérons entièrement nous-mêmes (spawn/kill
// classiques, sans particularité connue pour provoquer ce bug).
const tscWatcher = spawn(tscBin, ["-w", "-p", "tsconfig.build.json", "--preserveWatchOutput"], {
  cwd: apiDir,
  stdio: "inherit",
});

let shuttingDown = false;
let restarting = false;
let appProcess = null;
let restartTimer = null;

function startApp() {
  appProcess = spawn(process.execPath, [`--env-file-if-exists=${envFile}`, distEntry], {
    cwd: apiDir,
    stdio: "inherit",
  });
  appProcess.on("exit", () => {
    if (shuttingDown) {
      checkExit();
      return;
    }
    if (restarting) return;
    // Le processus applicatif s'est arrêté seul (ex. configuration invalide, erreur fatale) sans
    // qu'un redémarrage n'ait été demandé : on arrête tout proprement plutôt que de laisser
    // `tsc -w` tourner seul indéfiniment.
    shutdown();
  });
}

function scheduleRestart() {
  if (shuttingDown) return;
  // Regroupe les événements rapprochés (`tsc -w` réécrit plusieurs fichiers de `dist/` par passage
  // de compilation) en un seul redémarrage.
  clearTimeout(restartTimer);
  restartTimer = setTimeout(restartApp, 100);
}

function restartApp() {
  if (shuttingDown) return;
  const current = appProcess;
  if (current && current.exitCode === null && current.signalCode === null) {
    restarting = true;
    current.once("exit", () => {
      restarting = false;
      if (!shuttingDown) startApp();
    });
    current.kill("SIGTERM");
  } else {
    startApp();
  }
}

startApp();

const distWatcher = watch(distDir, { recursive: true }, (_eventType, filename) => {
  if (typeof filename === "string" && filename.endsWith(".js")) {
    scheduleRestart();
  }
});

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(restartTimer);
  distWatcher.close();
  if (tscWatcher.exitCode === null && tscWatcher.signalCode === null) {
    tscWatcher.kill("SIGTERM");
  }
  if (appProcess && appProcess.exitCode === null && appProcess.signalCode === null) {
    appProcess.kill("SIGTERM");
  }
  checkExit();
}

function checkExit() {
  if (!shuttingDown) return;
  const tscDone = tscWatcher.exitCode !== null || tscWatcher.signalCode !== null;
  const appDone = !appProcess || appProcess.exitCode !== null || appProcess.signalCode !== null;
  if (tscDone && appDone) {
    process.exit(0);
  }
}

tscWatcher.on("exit", () => {
  if (shuttingDown) checkExit();
  else shutdown();
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
