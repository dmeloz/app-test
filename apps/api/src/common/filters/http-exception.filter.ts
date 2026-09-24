import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { CORRELATION_ID_HEADER } from "../correlation/correlation";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    correlationId: string;
    details?: unknown;
  };
}

const HTTP_STATUS_CODE_NAMES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "UNPROCESSABLE_ENTITY",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_ERROR",
};

interface DescribedError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Filtre d'erreur global : format standard `{ error: { code, message, correlationId, details? } }`
 * (voir `docs/architecture/api-contracts.md`). Aucune trace de pile n'est jamais exposée au client.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest | undefined>();
    const correlationId = this.resolveCorrelationId(request);
    const described = this.describe(exception);

    if (described.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error({ correlationId, message: described.message }, stack);
    }

    const body: ErrorBody = {
      error: {
        code: described.code,
        message: described.message,
        correlationId,
        ...(described.details !== undefined ? { details: described.details } : {}),
      },
    };
    void reply.status(described.status).header(CORRELATION_ID_HEADER, correlationId).send(body);
  }

  private resolveCorrelationId(request: FastifyRequest | undefined): string {
    const header = request?.headers[CORRELATION_ID_HEADER];
    if (typeof header === "string" && header.length > 0) {
      return header;
    }
    if (Array.isArray(header) && header.length > 0 && header[0]) {
      return header[0];
    }
    return "unknown";
  }

  private describe(exception: unknown): DescribedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const code = HTTP_STATUS_CODE_NAMES[status] ?? "ERROR";

      if (typeof response === "string") {
        return { status, code, message: response };
      }

      const { message, statusCode: _statusCode, error: _error, ...details } = response as Record<
        string,
        unknown
      >;
      const normalizedMessage = Array.isArray(message)
        ? message.join(", ")
        : typeof message === "string"
          ? message
          : exception.message;

      return {
        status,
        code,
        message: normalizedMessage,
        details: Object.keys(details).length > 0 ? details : undefined,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_ERROR",
      message: "Une erreur interne est survenue.",
    };
  }
}
