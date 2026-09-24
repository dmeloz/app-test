import { Injectable } from "@nestjs/common";

/**
 * Sépare la logique de vérification (au lot L00 : seulement la configuration ; DB/Redis dès L01,
 * voir `health.controller.ts`) du contrôleur HTTP. Injecté par type (aucun jeton `@Inject`
 * explicite) : ce style d'injection dépend des métadonnées de décorateurs émises par le
 * compilateur (`emitDecoratorMetadata`) — un garde-fou concret contre une régression du mode
 * développement (M4, audit-1.md), où `tsx`/esbuild n'émettent pas ces métadonnées.
 */
@Injectable()
export class HealthService {
  checkReady(): { config: "ok" } {
    return { config: "ok" };
  }
}
