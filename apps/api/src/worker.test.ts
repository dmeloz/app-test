import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { runWorker } from "./worker";

describe("runWorker", () => {
  it("démarre puis s'arrête proprement à la réception de SIGTERM (boucle vide)", async () => {
    const fakeProcess = new EventEmitter() as unknown as NodeJS.Process;
    const promise = runWorker(fakeProcess);
    fakeProcess.emit("SIGTERM");
    await expect(promise).resolves.toBeUndefined();
  });

  it("s'arrête aussi sur SIGINT", async () => {
    const fakeProcess = new EventEmitter() as unknown as NodeJS.Process;
    const promise = runWorker(fakeProcess);
    fakeProcess.emit("SIGINT");
    await expect(promise).resolves.toBeUndefined();
  });
});
