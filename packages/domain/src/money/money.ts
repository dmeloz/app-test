/**
 * Type `Money` — ADR 0014 : montants en entiers (plus petite unité de la devise, ex. centimes) et
 * code de devise ISO 4217. Aucune opération entre devises différentes n'est permise.
 *
 * Ce module est volontairement pur (aucune dépendance à un framework) : voir `.claude/rules/architecture.md`.
 */

const ISO_4217_PATTERN = /^[A-Z]{3}$/;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

export interface Money {
  /** Montant entier exprimé dans la plus petite unité de la devise (ex. centimes pour CHF/EUR). */
  readonly amount: bigint;
  /** Code de devise ISO 4217 (3 lettres majuscules), ex. "CHF", "EUR". */
  readonly currency: string;
}

function assertValidCurrency(currency: string): void {
  if (!ISO_4217_PATTERN.test(currency)) {
    throw new MoneyError(
      `Code de devise ISO 4217 invalide : attendu 3 lettres majuscules (reçu "${currency}").`,
    );
  }
}

function toBigIntAmount(amount: number | bigint): bigint {
  if (typeof amount === "bigint") {
    return amount;
  }
  // L2 (audit-1.md) : `Number.isInteger` accepte des entiers non sûrs (au-delà de 2^53-1), dont la
  // représentation flottante peut déjà avoir perdu en précision avant même d'atteindre cette
  // fonction — inacceptable pour un montant financier. `Number.isSafeInteger` les rejette.
  if (!Number.isSafeInteger(amount)) {
    throw new MoneyError(
      "Le montant doit être un entier sûr (Number.isSafeInteger) exprimé dans la plus petite unité de la devise (aucune fraction de centime, aucun dépassement de précision).",
    );
  }
  return BigInt(amount);
}

/**
 * Construit un montant `Money`. `amount` est exprimé dans la plus petite unité de la devise
 * (ex. `1250` pour 12.50 CHF), jamais en unité majeure et jamais en nombre flottant fractionnaire.
 */
export function money(amount: number | bigint, currency: string): Money {
  assertValidCurrency(currency);
  const normalizedAmount = toBigIntAmount(amount);
  return Object.freeze({ amount: normalizedAmount, currency });
}

/** Additionne deux montants de la même devise. Lève `MoneyError` si les devises diffèrent. */
export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new MoneyError(
      `Impossible d'additionner des montants de devises différentes ("${a.currency}" et "${b.currency}").`,
    );
  }
  return money(a.amount + b.amount, a.currency);
}
