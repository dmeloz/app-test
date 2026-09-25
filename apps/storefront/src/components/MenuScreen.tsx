"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import {
  Button,
  CartBar,
  OptionGroupField,
  ProductCard,
  getInitialSelection,
  isSelectionValid,
  toggleSelection,
  type OptionGroupConfig,
} from "@app/ui";
import type { Locale } from "../i18n/dictionary";
import { formatChf } from "../mock/format";
import { localize } from "../mock/localize";
import type { CartLineSelection, MockCategory, MockOptionGroup, MockProduct } from "../mock/types";
import { cartItemCount, cartTotalCents } from "../state/cart-calculations";
import { useCartStore } from "../state/cart-store";

interface MenuDictionary {
  readonly heading: string;
  readonly allergensLabel: string;
  readonly soldOutLabel: string;
  readonly addToCart: string;
  readonly includedChoice: string;
  readonly requiredHint: string;
  readonly optionalHint: string;
  readonly selectionError: string;
  readonly cartRegionLabel: string;
  readonly goToCart: string;
}

export interface MenuScreenProps {
  readonly locale: Locale;
  readonly dictionary: MenuDictionary;
  readonly menu: readonly MockCategory[];
}

function toOptionGroupConfig(group: MockOptionGroup, locale: Locale): OptionGroupConfig {
  return {
    id: group.id,
    label: localize(group.label, locale),
    min: group.min,
    max: group.max,
    choices: group.choices.map((choice) => ({
      id: choice.id,
      label: localize(choice.label, locale),
      priceCents: choice.priceCents,
    })),
  };
}

interface ProductRowProps {
  readonly product: MockProduct;
  readonly locale: Locale;
  readonly dictionary: MenuDictionary;
  readonly onAdd: (selections: readonly CartLineSelection[]) => void;
}

function ProductRow({ product, locale, dictionary, onAdd }: ProductRowProps): ReactElement {
  const configs = product.optionGroups.map((group) => toOptionGroupConfig(group, locale));
  const [selections, setSelections] = useState<Record<string, readonly string[]>>(() =>
    Object.fromEntries(configs.map((config) => [config.id, getInitialSelection(config)])),
  );
  const [showError, setShowError] = useState(false);

  const allValid = configs.every((config) =>
    isSelectionValid(config, selections[config.id] ?? []),
  );

  function handleToggle(config: OptionGroupConfig, choiceId: string): void {
    setSelections((current) => ({
      ...current,
      [config.id]: toggleSelection(config, current[config.id] ?? [], choiceId),
    }));
  }

  function handleAdd(): void {
    if (!allValid) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onAdd(
      configs.map((config) => ({ groupId: config.id, choiceIds: selections[config.id] ?? [] })),
    );
    setSelections(
      Object.fromEntries(configs.map((config) => [config.id, getInitialSelection(config)])),
    );
  }

  const card = (
    <ProductCard
      name={localize(product.name, locale)}
      description={localize(product.description, locale) || undefined}
      formattedPrice={formatChf(product.priceCents, locale)}
      allergens={product.allergens.map((allergen) => localize(allergen, locale))}
      allergensLabel={dictionary.allergensLabel}
      soldOut={product.soldOut}
      soldOutLabel={dictionary.soldOutLabel}
    >
      {configs.length === 0 ? (
        <Button onClick={() => onAdd([])} block>
          {dictionary.addToCart}
        </Button>
      ) : (
        <div className="ui-stack ui-stack--sm">
          {configs.map((config) => (
            <OptionGroupField
              key={config.id}
              config={config}
              selected={selections[config.id] ?? []}
              onToggle={(choiceId) => handleToggle(config, choiceId)}
              formatSurcharge={(cents) => formatChf(cents, locale)}
              includedLabel={dictionary.includedChoice}
              hint={config.min > 0 ? dictionary.requiredHint : dictionary.optionalHint}
              showError={showError}
              errorText={dictionary.selectionError}
            />
          ))}
          <Button onClick={handleAdd} block>
            {dictionary.addToCart}
          </Button>
        </div>
      )}
    </ProductCard>
  );

  return card;
}

// Écran 2 (spec P01 §2) : catégories, produits (photo, variantes, groupes d'options min/max,
// suppléments jamais présélectionnés, allergènes visibles, rupture grisée) ; barre de panier fixe.
export function MenuScreen({ locale, dictionary, menu }: MenuScreenProps): ReactElement {
  const { lines, addLine } = useCartStore();

  return (
    <main className="ui-container">
      <div className="ui-stack">
        <h1 className="ui-heading-xl">{dictionary.heading}</h1>
        {menu.map((category) => (
          <section key={category.id} className="ui-stack ui-stack--sm">
            <h2 className="ui-heading-lg">{localize(category.name, locale)}</h2>
            <div className="ui-stack ui-stack--sm">
              {category.products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  locale={locale}
                  dictionary={dictionary}
                  onAdd={(selections) =>
                    addLine({
                      lineId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      productId: product.id,
                      quantity: 1,
                      selections,
                    })
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <CartBar
        itemCount={cartItemCount(lines)}
        formattedTotal={formatChf(cartTotalCents(menu, lines), locale)}
        label={dictionary.goToCart}
        href={`/${locale}/panier`}
        regionLabel={dictionary.cartRegionLabel}
      />
    </main>
  );
}
