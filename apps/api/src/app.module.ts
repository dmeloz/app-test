import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import type { AppConfig } from "./config/env.schema";
import { HealthModule } from "./modules/health";

@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [ConfigModule.forRoot(config), HealthModule],
    };
  }
}
