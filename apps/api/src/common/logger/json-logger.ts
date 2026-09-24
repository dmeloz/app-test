export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

/**
 * Petit logger JSON structuré pour le bootstrap et le worker (hors requêtes HTTP : celles-ci
 * passent par le logger Fastify/pino configuré dans `main.ts`). Liste blanche de champs : jamais
 * d'e-mail, téléphone, adresse, token, secret ou payload complet (`.claude/rules/backend.md`).
 */
export function log(level: LogLevel, message: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...fields });
  if (level === "error" || level === "fatal") {
    console.error(line);
  } else {
    console.log(line);
  }
}
