// Calculs d'affichage de la maquette (jamais un total facturé réel — règle n°1 du CLAUDE.md : aucun
// montant calculé par le navigateur n'est jamais accepté comme faisant foi ; ici, il n'existe de
// toute façon aucun serveur/aucune commande réelle, spec P01 §2 « Exclu »). Pur, testable sans React.
import type { CartLine, CartLineSelection, MockCategory, MockProduct } from "../mock/types";

export function allProducts(menu: readonly MockCategory[]): readonly MockProduct[] {
  return menu.flatMap((category) => category.products);
}

export function findProduct(
  menu: readonly MockCategory[],
  productId: string,
): MockProduct | undefined {
  return allProducts(menu).find((product) => product.id === productId);
}

export function lineSurchargeCents(
  product: MockProduct,
  selections: readonly CartLineSelection[],
): number {
  let total = 0;
  for (const group of product.optionGroups) {
    const selection = selections.find((entry) => entry.groupId === group.id);
    if (!selection) {
      continue;
    }
    for (const choiceId of selection.choiceIds) {
      const choice = group.choices.find((candidate) => candidate.id === choiceId);
      if (choice) {
        total += choice.priceCents;
      }
    }
  }
  return total;
}

export function lineUnitPriceCents(
  product: MockProduct,
  selections: readonly CartLineSelection[],
): number {
  return product.priceCents + lineSurchargeCents(product, selections);
}

export function lineTotalCents(product: MockProduct, line: CartLine): number {
  return lineUnitPriceCents(product, line.selections) * line.quantity;
}

export function cartTotalCents(menu: readonly MockCategory[], lines: readonly CartLine[]): number {
  const products = allProducts(menu);
  return lines.reduce((sum, line) => {
    const product = products.find((candidate) => candidate.id === line.productId);
    return product ? sum + lineTotalCents(product, line) : sum;
  }, 0);
}

export function cartItemCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Toutes les sélections obligatoires (min ≥ 1) sont-elles valides pour ce produit ? */
export function areRequiredSelectionsValid(
  product: MockProduct,
  selections: readonly CartLineSelection[],
): boolean {
  return product.optionGroups.every((group) => {
    const selection = selections.find((entry) => entry.groupId === group.id);
    const count = selection?.choiceIds.length ?? 0;
    return count >= group.min && count <= group.max;
  });
}
