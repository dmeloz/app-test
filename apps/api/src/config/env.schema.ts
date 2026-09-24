import { z } from "zod";

/**
 * Schéma de configuration de l'API. Volontairement minimal au lot L00 (pas de DB/Redis/auth).
 *
 * Important : on ne valide PAS `process.env` avec `.strict()` — contrairement aux entrées API
 * (voir `.claude/rules/backend.md`), `process.env` contient toujours des variables systèmes
 * hors de notre contrôle (PATH, HOME, …) qu'il ne faut pas rejeter.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  HOST: z.string().min(1).default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type AppConfig = z.infer<typeof envSchema>;

/**
 * Erreur de configuration au démarrage. Le message ne contient jamais la valeur fournie par
 * l'environnement (AC-L00-05) : seulement le nom du champ concerné et la nature du problème.
 */
export class ConfigValidationError extends Error {
  constructor(issues: readonly string[]) {
    super(`Configuration invalide :\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "ConfigValidationError";
  }
}

function describeIssueWithoutLeakingValue(issue: z.core.$ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.map(String).join(".") : "(racine)";
  switch (issue.code) {
    case "invalid_type":
      return `${path} : variable manquante ou de type invalide`;
    case "too_small":
    case "too_big":
      return `${path} : hors des bornes autorisées`;
    default:
      return `${path} : valeur invalide`;
  }
}

/**
 * Valide les variables d'environnement au démarrage (API et worker). Lève `ConfigValidationError`
 * — sans jamais journaliser ni inclure la valeur fournie — si une variable requise est manquante
 * ou invalide (AC-L00-05).
 */
export function loadConfig(rawEnv: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const issues = result.error.issues.map(describeIssueWithoutLeakingValue);
    throw new ConfigValidationError(issues);
  }
  return result.data;
}
