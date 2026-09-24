import { ArgumentsHost, BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { GlobalExceptionFilter } from "./http-exception.filter";

function createHost(headers: Record<string, string | undefined>) {
  const reply = {
    status: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  const request = { headers };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => reply,
    }),
  } as unknown as ArgumentsHost;
  return { host, reply };
}

describe("GlobalExceptionFilter", () => {
  it("formate une HttpException connue avec le code, le message et le correlationId", () => {
    const filter = new GlobalExceptionFilter();
    const { host, reply } = createHost({ "x-correlation-id": "corr-1" });

    filter.catch(new NotFoundException("Introuvable"), host);

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.header).toHaveBeenCalledWith("x-correlation-id", "corr-1");
    expect(reply.send).toHaveBeenCalledWith({
      error: { code: "NOT_FOUND", message: "Introuvable", correlationId: "corr-1" },
    });
  });

  it("inclut les détails de validation d'une BadRequestException", () => {
    const filter = new GlobalExceptionFilter();
    const { host, reply } = createHost({ "x-correlation-id": "corr-2" });

    filter.catch(new BadRequestException({ message: ["champ requis"], fields: ["email"] }), host);

    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: "BAD_REQUEST",
        message: "champ requis",
        correlationId: "corr-2",
        details: { fields: ["email"] },
      },
    });
  });

  it("masque toute erreur non-HTTP derrière un message générique (aucune trace exposée)", () => {
    const filter = new GlobalExceptionFilter();
    const { host, reply } = createHost({ "x-correlation-id": "corr-3" });

    filter.catch(new Error("détail interne sensible"), host);

    expect(reply.status).toHaveBeenCalledWith(500);
    const sent = reply.send.mock.calls[0]?.[0];
    expect(sent.error.message).toBe("Une erreur interne est survenue.");
    expect(JSON.stringify(sent)).not.toContain("détail interne sensible");
  });

  it("utilise 'unknown' si aucun correlationId n'est présent sur la requête", () => {
    const filter = new GlobalExceptionFilter();
    const { host, reply } = createHost({});

    filter.catch(new NotFoundException(), host);

    const sent = reply.send.mock.calls[0]?.[0];
    expect(sent.error.correlationId).toBe("unknown");
  });
});
