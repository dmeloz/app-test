import { describe, expect, it } from "vitest";
import type { FastifyRequest } from "fastify";
import { extractOrGenerateCorrelationId } from "./correlation.js";

function fakeRequest(headers: Record<string, string | string[] | undefined>): FastifyRequest {
  return { headers } as unknown as FastifyRequest;
}

describe("extractOrGenerateCorrelationId", () => {
  it("réutilise l'en-tête x-correlation-id fourni par le client", () => {
    const id = extractOrGenerateCorrelationId(fakeRequest({ "x-correlation-id": "abc-123" }));
    expect(id).toBe("abc-123");
  });

  it("génère un identifiant si l'en-tête est absent", () => {
    const id = extractOrGenerateCorrelationId(fakeRequest({}));
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("génère un identifiant si l'en-tête est vide", () => {
    const id = extractOrGenerateCorrelationId(fakeRequest({ "x-correlation-id": "" }));
    expect(id.length).toBeGreaterThan(0);
    expect(id).not.toBe("");
  });

  it("prend la première valeur si l'en-tête est répété", () => {
    const id = extractOrGenerateCorrelationId(
      fakeRequest({ "x-correlation-id": ["first-id", "second-id"] }),
    );
    expect(id).toBe("first-id");
  });
});
