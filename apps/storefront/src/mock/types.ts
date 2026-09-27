// provisoire — remplacé par packages/contracts au L04
//
// Types de données fictives pour la maquette P01 uniquement. Aucun de ces types ne représente un
// contrat d'API réel ; ils ne sont importés que par `apps/storefront` (jamais par `packages/*`,
// règle de frontières ESLint AC-P01-11).
export interface LocalizedText {
  readonly fr: string;
  readonly en: string;
}

export interface MockOptionChoice {
  readonly id: string;
  readonly label: LocalizedText;
  /** Supplément en centimes (0 si inclus dans le prix du produit). */
  readonly priceCents: number;
}

export interface MockOptionGroup {
  readonly id: string;
  readonly label: LocalizedText;
  readonly min: number;
  readonly max: number;
  readonly choices: readonly MockOptionChoice[];
}

export interface MockProduct {
  readonly id: string;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly priceCents: number;
  readonly currency: string;
  readonly allergens: readonly LocalizedText[];
  readonly soldOut: boolean;
  readonly optionGroups: readonly MockOptionGroup[];
}

export interface MockCategory {
  readonly id: string;
  readonly name: LocalizedText;
  readonly products: readonly MockProduct[];
}

export interface MockSlot {
  readonly id: string;
  readonly label: LocalizedText;
  readonly available: boolean;
}

export type Channel = "pickup" | "delivery";

export interface MockRestaurant {
  readonly name: string;
  readonly tagline: LocalizedText;
  readonly address: string;
  readonly city: string;
  readonly openingHours: LocalizedText;
  readonly isOpen: boolean;
  readonly estimatedDelayMinutes: number;
  readonly currency: string;
}

export interface CartLineSelection {
  readonly groupId: string;
  readonly choiceIds: readonly string[];
}

export interface CartLine {
  readonly lineId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly selections: readonly CartLineSelection[];
}

export type OrderStatus = "accepted" | "preparing" | "ready";

export interface GuestInfo {
  readonly name: string;
  readonly phone: string;
  readonly note: string;
}
