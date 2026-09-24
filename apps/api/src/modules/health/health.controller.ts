import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { HealthService } from "./health.service.js";

interface LiveResponse {
  status: "ok";
}

interface ReadyResponse {
  status: "ok";
  // Au lot L00, seule la configuration est vérifiée (pas de DB/Redis, exclus de ce lot — voir spec).
  // La structure est volontairement prévue pour accueillir `db` et `redis` dès le lot L01.
  checks: {
    config: "ok";
  };
}

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("live")
  @HttpCode(HttpStatus.OK)
  live(): LiveResponse {
    return { status: "ok" };
  }

  @Get("ready")
  @HttpCode(HttpStatus.OK)
  ready(): ReadyResponse {
    return { status: "ok", checks: this.healthService.checkReady() };
  }
}
