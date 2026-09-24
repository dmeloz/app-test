import { Writable } from "node:stream";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.schema.js";

/** Capture en mémoire des lignes NDJSON écrites par le logger Fastify/pino (M5, audit-1.md). */
class MemoryLogStream extends Writable {
  readonly raw: string[] = [];

  override _write(
    chunk: unknown,
    _encoding: string,
    callback: (error?: Error | null) => void,
  ): void {
    this.raw.push(String(chunk));
    callback();
  }

  /** Chaque ligne non vide, parsée en JSON (lève si une ligne n'est pas un JSON valide). */
  lines(): Record<string, unknown>[] {
    return this.raw
      .join("")
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  }
}

async function bootTestApp(stream?: Writable): Promise<NestFastifyApplication> {
  const config = loadConfig({ NODE_ENV: "test" });
  const app = await createApp(config, stream ? { logger: stream } : {});
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

describe("Logs de requête Fastify (H2 — correlationId, format JSON)", () => {
  it("chaque ligne de log est un JSON valide et porte correlationId === l'id fourni par le client", async () => {
    const stream = new MemoryLogStream();
    const app = await bootTestApp(stream);

    const response = await app.inject({
      method: "GET",
      url: "/health/live",
      headers: { "x-correlation-id": "t-1" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["x-correlation-id"]).toBe("t-1");

    await app.close();

    // Chaque ligne écrite doit être un JSON valide (pas de texte brut, pas d'en-tête coloré).
    for (const rawLine of stream.raw
      .join("")
      .split("\n")
      .filter((line) => line.trim().length > 0)) {
      expect(() => JSON.parse(rawLine)).not.toThrow();
    }

    const lines = stream.lines();
    expect(lines.length).toBeGreaterThan(0);

    const requestLines = lines.filter(
      (line) => typeof line.msg === "string" && /request/i.test(line.msg),
    );
    // Fastify émet au moins "incoming request" et "request completed" par requête traitée.
    expect(requestLines.length).toBeGreaterThanOrEqual(2);
    for (const line of requestLines) {
      expect(line.correlationId).toBe("t-1");
      expect(line.reqId).toBeUndefined();
    }
  });

  it("génère un correlationId si le client n'en fournit pas, identique dans les logs et l'en-tête", async () => {
    const stream = new MemoryLogStream();
    const app = await bootTestApp(stream);

    const response = await app.inject({ method: "GET", url: "/health/live" });
    await app.close();

    const generatedId = response.headers["x-correlation-id"];
    expect(typeof generatedId).toBe("string");
    expect((generatedId as string).length).toBeGreaterThan(0);

    const lines = stream.lines();
    const withCorrelationId = lines.filter((line) => typeof line.correlationId === "string");
    expect(withCorrelationId.length).toBeGreaterThan(0);
    for (const line of withCorrelationId) {
      expect(line.correlationId).toBe(generatedId);
    }
  });

  it("ignore un en-tête client mal formé (L7) et en génère un valide à la place", async () => {
    const stream = new MemoryLogStream();
    const app = await bootTestApp(stream);

    const response = await app.inject({
      method: "GET",
      url: "/health/live",
      headers: { "x-correlation-id": "<script>alert(1)</script>" },
    });
    await app.close();

    const returnedId = response.headers["x-correlation-id"];
    expect(typeof returnedId).toBe("string");
    expect(returnedId).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("Sérialiseur `req` en liste d'autorisation (N4, audit-2.md)", () => {
  it("aucune ligne de log ne contient la query string, l'IP ou le host bruts", async () => {
    const stream = new MemoryLogStream();
    const app = await bootTestApp(stream);

    const response = await app.inject({
      method: "GET",
      url: "/health/live?token=x",
    });
    expect(response.statusCode).toBe(200);

    await app.close();

    const rawOutput = stream.raw.join("");
    expect(rawOutput).not.toContain("token=");
    expect(rawOutput).not.toContain("remoteAddress");
    expect(rawOutput).not.toContain("remotePort");

    const lines = stream.lines();
    const requestLines = lines.filter(
      (line) => typeof line.msg === "string" && /request/i.test(line.msg),
    );
    expect(requestLines.length).toBeGreaterThanOrEqual(2);
    for (const line of requestLines) {
      if (line.req !== undefined) {
        const req = line.req as Record<string, unknown>;
        // Liste d'autorisation stricte : uniquement `method` et `url` (chemin, sans query string).
        expect(Object.keys(req).sort()).toEqual(["method", "url"]);
        expect(req.url).toBe("/health/live");
        expect(req.method).toBe("GET");
      }
    }
  });
});

describe("En-têtes de sécurité (Helmet, via createApp)", () => {
  it("toute réponse porte les en-têtes de sécurité attendus", async () => {
    const app = await bootTestApp();

    const response = await app.inject({ method: "GET", url: "/health/live" });
    await app.close();

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBeDefined();
    expect(response.headers["content-security-policy"]).toBeDefined();
  });
});
