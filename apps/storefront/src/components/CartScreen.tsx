"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent, ReactElement } from "react";
import { Button, SlotList } from "@app/ui";
import type { Locale } from "../i18n/dictionary";
import { MINIMUM_ORDER_FOR_DELIVERY_CENTS } from "../mock/delivery";
import { formatChf } from "../mock/format";
import { localize } from "../mock/localize";
import type { MockCategory, MockSlot } from "../mock/types";
import {
  allProducts,
  cartTotalCents,
  deliveryFeeCents,
  isBelowDeliveryMinimum,
  lineTotalCents,
} from "../state/cart-calculations";
import { useCartStore } from "../state/cart-store";

interface CartDictionary {
  readonly heading: string;
  readonly emptyMessage: string;
  readonly removeLine: string;
  readonly removeLineLabel: string;
  readonly decreaseQuantity: string;
  readonly increaseQuantity: string;
  readonly quantityLabel: string;
  readonly totalLabel: string;
  readonly deliveryFeeLabel: string;
  readonly minimumOrderPrefix: string;
  readonly minimumOrderMissingPrefix: string;
  readonly minimumOrderMissingSuffix: string;
  readonly slotHeading: string;
  readonly asapLabel: string;
  readonly slotUnavailable: string;
  readonly slotRequiredWarning: string;
  readonly guestHeading: string;
  readonly guestName: string;
  readonly guestPhone: string;
  readonly guestNote: string;
  readonly payButton: string;
  readonly missingChannelWarning: string;
}

export interface CartScreenProps {
  readonly locale: Locale;
  readonly dictionary: CartDictionary;
  readonly menu: readonly MockCategory[];
  readonly slots: readonly MockSlot[];
}

// N1 (audit-2.md) : substitue le jeton `{product}` d'un gabarit du dictionnaire — voir le commentaire
// de `CartDictionary` (`i18n/dictionary.ts`) sur la raison de ce choix (frontière RSC → client).
function withProductName(template: string, productName: string): string {
  return template.replace("{product}", productName);
}

// Écran 3 (spec P01 §2) : lignes modifiables, frais et minimum affichés (aucun ici — maquette),
// choix « dès que possible » ou créneau, formulaire invité minimal, bouton « Payer ».
export function CartScreen({ locale, dictionary, menu, slots }: CartScreenProps): ReactElement {
  const router = useRouter();
  const {
    channel,
    lines,
    removeLine,
    updateLineQuantity,
    slotId,
    asap,
    setSlot,
    setAsap,
    guest,
    setGuest,
  } = useCartStore();
  const products = allProducts(menu);

  function handleGuestChange(field: "name" | "phone" | "note") {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setGuest({ ...guest, [field]: event.target.value });
    };
  }

  function handlePay(): void {
    router.push(`/${locale}/paiement`);
  }

  // M2 (audit-1.md) : frais de livraison fictifs (canal livraison uniquement) et minimum de commande
  // pour la livraison, tous deux inclus dans le total affiché.
  const subtotal = cartTotalCents(menu, lines);
  const fee = deliveryFeeCents(channel);
  const total = subtotal + fee;
  const belowMinimum = isBelowDeliveryMinimum(subtotal, channel);
  // L10 (audit-1.md) : « Payer » exige un canal, un panier non vide, aucun avertissement de minimum
  // non atteint, et soit « dès que possible » soit un créneau choisi (jamais aucun des deux).
  const canPay = channel !== null && lines.length > 0 && !belowMinimum && (asap || slotId !== null);

  return (
    <main className="ui-container">
      <div className="ui-stack">
        <h1 className="ui-heading-xl">{dictionary.heading}</h1>

        {channel === null ? <p role="alert">{dictionary.missingChannelWarning}</p> : null}

        {lines.length === 0 ? (
          <p>{dictionary.emptyMessage}</p>
        ) : (
          <ul className="ui-stack ui-stack--sm">
            {lines.map((line) => {
              const product = products.find((candidate) => candidate.id === line.productId);
              if (!product) {
                return null;
              }
              const optionLabels = line.selections
                .flatMap((selection) => {
                  const group = product.optionGroups.find((g) => g.id === selection.groupId);
                  if (!group) {
                    return [];
                  }
                  return selection.choiceIds.map((choiceId) => {
                    const choice = group.choices.find((c) => c.id === choiceId);
                    return choice ? localize(choice.label, locale) : null;
                  });
                })
                .filter((value): value is string => Boolean(value));
              const productName = localize(product.name, locale);
              return (
                <li key={line.lineId} className="ui-card">
                  <div className="ui-product-card__header">
                    <span>{productName}</span>
                    <span>{formatChf(lineTotalCents(product, line), locale)}</span>
                  </div>
                  {optionLabels.length > 0 ? (
                    <p className="ui-text-muted">{optionLabels.join(", ")}</p>
                  ) : null}
                  {/* L10 (audit-1.md) : lignes modifiables — +/- de quantité, pas seulement retrait. */}
                  {/* N1 (audit-2.md) : boutons contextualisés (nom du produit) et quantité exposée
                      aux technologies d'assistance (`aria-hidden` retiré, texte visuellement masqué
                      + `aria-live="polite"` sur la valeur, plutôt qu'une information visible seule). */}
                  <div className="ui-quantity-control">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={withProductName(dictionary.decreaseQuantity, productName)}
                      onClick={() => updateLineQuantity(line.lineId, line.quantity - 1)}
                    >
                      −
                    </Button>
                    <span className="ui-quantity-control__value" aria-live="polite">
                      <span className="ui-visually-hidden">
                        {withProductName(dictionary.quantityLabel, productName)}
                      </span>{" "}
                      {line.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={withProductName(dictionary.increaseQuantity, productName)}
                      onClick={() => updateLineQuantity(line.lineId, line.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={withProductName(dictionary.removeLineLabel, productName)}
                      onClick={() => removeLine(line.lineId)}
                    >
                      {dictionary.removeLine}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* M2 (audit-1.md) : frais et minimum affichés (spec P01 §2.3), canal livraison seulement. */}
        {channel === "delivery" ? (
          <p>
            {dictionary.deliveryFeeLabel} : {formatChf(fee, locale)}
          </p>
        ) : null}
        {belowMinimum ? (
          <p role="alert">
            {dictionary.minimumOrderPrefix} {formatChf(MINIMUM_ORDER_FOR_DELIVERY_CENTS, locale)}.{" "}
            {dictionary.minimumOrderMissingPrefix}{" "}
            {formatChf(MINIMUM_ORDER_FOR_DELIVERY_CENTS - subtotal, locale)}{" "}
            {dictionary.minimumOrderMissingSuffix}
          </p>
        ) : null}
        <p className="ui-heading-lg">
          {dictionary.totalLabel} : {formatChf(total, locale)}
        </p>

        <section className="ui-stack ui-stack--sm">
          <h2 className="ui-heading-lg">{dictionary.slotHeading}</h2>
          <label className="ui-slot">
            <input
              type="checkbox"
              checked={asap}
              onChange={(event) => setAsap(event.target.checked)}
            />
            <span>{dictionary.asapLabel}</span>
          </label>
          {!asap ? (
            <>
              <SlotList
                slots={slots.map((slot) => ({
                  id: slot.id,
                  label: localize(slot.label, locale),
                  available: slot.available,
                }))}
                selectedId={slotId}
                onSelect={setSlot}
                unavailableLabel={dictionary.slotUnavailable}
              />
              {/* L10 (audit-1.md) : « Payer » exige asap OU un créneau choisi — jamais aucun des deux. */}
              {slotId === null ? <p role="alert">{dictionary.slotRequiredWarning}</p> : null}
            </>
          ) : null}
        </section>

        <section className="ui-stack ui-stack--sm">
          <h2 className="ui-heading-lg">{dictionary.guestHeading}</h2>
          <div className="ui-field">
            <label htmlFor="guest-name">{dictionary.guestName}</label>
            <input
              id="guest-name"
              className="ui-input"
              value={guest.name}
              onChange={handleGuestChange("name")}
            />
          </div>
          <div className="ui-field">
            <label htmlFor="guest-phone">{dictionary.guestPhone}</label>
            <input
              id="guest-phone"
              className="ui-input"
              type="tel"
              value={guest.phone}
              onChange={handleGuestChange("phone")}
            />
          </div>
          <div className="ui-field">
            <label htmlFor="guest-note">{dictionary.guestNote}</label>
            <textarea
              id="guest-note"
              className="ui-textarea"
              value={guest.note}
              onChange={handleGuestChange("note")}
            />
          </div>
        </section>

        <Button onClick={handlePay} disabled={!canPay} block>
          {dictionary.payButton}
        </Button>
      </div>
    </main>
  );
}
