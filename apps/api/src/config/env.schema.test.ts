import { describe, expect, it } from "vitest";
import { ConfigValidationError, loadConfig } from "./env.schema";

describe("loadConfig", () => {
  it("accepte une configuration minimale valide et applique les valeurs par défaut", () => {
    const config = loadConfig({ NODE_ENV: "test" });
    expect(config.NODE_ENV).toBe("test");
    expect(config.PORT).toBe(3000);
    expect(config.HOST).toBe("0.0.0.0");
    expect(config.LOG_LEVEL).toBe("info");
  });

  it("accepte les valeurs explicites et coerce PORT en nombre", () => {
    const config = loadConfig({ NODE_ENV: "production", PORT: "8080", LOG_LEVEL: "warn" });
    expect(config.PORT).toBe(8080);
    expect(config.LOG_LEVEL).toBe("warn");
  });

  it("refuse de démarrer si une variable requise est manquante (AC-L00-05)", () => {
    expect(() => loadConfig({})).toThrow(ConfigValidationError);
    expect(() => loadConfig({})).toThrow(/NODE_ENV/);
  });

  it("refuse de démarrer si une variable requise est invalide, sans jamais afficher la valeur", () => {
    const secretLookingValue = "ne-doit-jamais-apparaitre-dans-le-message";
    try {
      loadConfig({ NODE_ENV: secretLookingValue });
      throw new Error("loadConfig aurait dû lever une erreur");
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      const message = (error as Error).message;
      expect(message).toMatch(/NODE_ENV/);
      expect(message).not.toContain(secretLookingValue);
    }
  });

  it("refuse un PORT invalide (hors bornes) sans afficher la valeur fournie", () => {
    try {
      loadConfig({ NODE_ENV: "test", PORT: "999999" });
      throw new Error("loadConfig aurait dû lever une erreur");
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      expect((error as Error).message).not.toContain("999999");
    }
  });
});
