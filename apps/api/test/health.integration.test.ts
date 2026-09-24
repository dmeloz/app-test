import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.schema.js";

/**
 * Intégration légère (plan de test §9) : démarrage de l'API avec l'adaptateur Fastify réellement
 * injecté (via `app.inject`, sans ouvrir de port réseau) — /health/*, en-tête de corrélation, 404 standard.
 * Utilise `createApp` (M5, audit-1.md) : même bootstrap que `main.ts`, pas de recâblage manuel.
 */
describe("API (intégration légère, Fastify injecté)", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const config = loadConfig({ NODE_ENV: "test" });
    app = await createApp(config);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health/live renvoie 200 { status: ok }", async () => {
    const response = await app.inject({ method: "GET", url: "/health/live" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("GET /health/ready renvoie 200 avec la section checks.config", async () => {
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", checks: { config: "ok" } });
  });

  it("toute réponse porte x-correlation-id ; un id fourni est réutilisé (AC-L00-06)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health/live",
      headers: { "x-correlation-id": "test-correlation-42" },
    });
    expect(response.headers["x-correlation-id"]).toBe("test-correlation-42");
  });

  it("génère un x-correlation-id si absent", async () => {
    const response = await app.inject({ method: "GET", url: "/health/live" });
    expect(response.headers["x-correlation-id"]).toBeTruthy();
  });

  it("une route inconnue renvoie une 404 au format d'erreur standard", async () => {
    const response = await app.inject({ method: "GET", url: "/route-inexistante" });
    expect(response.statusCode).toBe(404);
    const body = response.json() as {
      error: { code: string; message: string; correlationId: string };
    };
    expect(body.error.code).toBe("NOT_FOUND");
    expect(typeof body.error.message).toBe("string");
    expect(typeof body.error.correlationId).toBe("string");
    expect(body.error.correlationId).not.toBe("unknown");
  });
});
