// provisoire — remplacé par packages/contracts au L04
//
// Types de données fictives pour la maquette P01 uniquement. N'importe que par `apps/backoffice`
// (jamais par `packages/*`, règle de frontières ESLint AC-P01-11) ; isolé de `apps/storefront/src/mock`
// (deux apps ne partagent jamais leurs données fictives, aucune n'importe l'autre app — ADR 0001).
export interface LocalizedText {
  readonly fr: string;
  readonly en: string;
}

export interface MockOrderLine {
  readonly name: LocalizedText;
  readonly quantity: number;
  readonly options: readonly LocalizedText[];
}

export type BoardOrderStatus = "new" | "preparing" | "ready" | "refused";

export interface MockOrder {
  readonly id: string;
  readonly number: string;
  readonly slotLabel: LocalizedText;
  readonly lines: readonly MockOrderLine[];
  readonly note?: LocalizedText;
  readonly status: BoardOrderStatus;
  readonly refusalReason?: string;
}

export interface MockMenuItem {
  readonly id: string;
  readonly name: LocalizedText;
  readonly soldOut: boolean;
}
