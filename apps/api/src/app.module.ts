import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module.js";
import type { AppConfig } from "./config/env.schema.js";
import { HealthModule } from "./modules/health/index.js";

@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [ConfigModule.forRoot(config), HealthModule],
    };
  }
}
