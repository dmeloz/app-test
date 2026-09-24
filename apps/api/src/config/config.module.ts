import { DynamicModule, Global, Module } from "@nestjs/common";
import type { AppConfig } from "./env.schema";

export const APP_CONFIG = Symbol("APP_CONFIG");

/**
 * Expose la configuration déjà validée (voir `loadConfig` dans `env.schema.ts`, appelé une seule
 * fois au bootstrap) au reste de l'application via l'injection de dépendances.
 */
@Global()
@Module({})
export class ConfigModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: APP_CONFIG, useValue: config }],
      exports: [APP_CONFIG],
    };
  }
}
