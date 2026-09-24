import { describe, expect, it } from "vitest";
import { add, money, MoneyError } from "./money";

describe("money", () => {
  it("construit un montant à partir d'un entier de la plus petite unité", () => {
    const chf = money(1250, "CHF");
    expect(chf.amount).toBe(1250n);
    expect(chf.currency).toBe("CHF");
  });

  it("refuse un montant non entier (fraction de centime)", () => {
    expect(() => money(10.5, "CHF")).toThrow(MoneyError);
  });

  it("refuse un code de devise invalide", () => {
    expect(() => money(100, "chf")).toThrow(MoneyError);
    expect(() => money(100, "SWISS")).toThrow(MoneyError);
  });
});

describe("add", () => {
  it("additionne deux montants CHF : 10.00 + 2.50 = 12.50 (1250 centimes)", () => {
    const a = money(1000, "CHF"); // 10.00 CHF
    const b = money(250, "CHF"); // 2.50 CHF
    const result = add(a, b);
    expect(result.amount).toBe(1250n);
    expect(result.currency).toBe("CHF");
  });

  it("lève une erreur pour des devises différentes (CHF + EUR)", () => {
    const chf = money(1000, "CHF");
    const eur = money(1000, "EUR");
    expect(() => add(chf, eur)).toThrow(MoneyError);
    expect(() => add(chf, eur)).toThrow(/devises différentes/);
  });

  it("gère le cas limite zéro", () => {
    const result = add(money(0, "CHF"), money(0, "CHF"));
    expect(result.amount).toBe(0n);
  });

  it("gère de grands montants sans perte de précision (bigint)", () => {
    const big = money(Number.MAX_SAFE_INTEGER, "CHF");
    const result = add(big, money(1, "CHF"));
    expect(result.amount).toBe(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
  });
});
