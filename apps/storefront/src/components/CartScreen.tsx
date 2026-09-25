"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent, ReactElement } from "react";
import { Button, SlotList } from "@app/ui";
import type { Locale } from "../i18n/dictionary";
import { formatChf } from "../mock/format";
import { localize } from "../mock/localize";
import type { MockCategory, MockSlot } from "../mock/types";
import { allProducts, cartTotalCents, lineTotalCents } from "../state/cart-calculations";
import { useCartStore } from "../state/cart-store";

interface CartDictionary {
  readonly heading: string;
  readonly emptyMessage: string;
  readonly removeLine: string;
  readonly totalLabel: string;
  readonly slotHeading: string;
  readonly asapLabel: string;
  readonly slotUnavailable: string;
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

// Écran 3 (spec P01 §2) : lignes modifiables, frais et minimum affichés (aucun ici — maquette),
// choix « dès que possible » ou créneau, formulaire invité minimal, bouton « Payer ».
export function CartScreen({ locale, dictionary, menu, slots }: CartScreenProps): ReactElement {
  const router = useRouter();
  const { channel, lines, removeLine, slotId, asap, setSlot, setAsap, guest, setGuest } =
    useCartStore();
  const products = allProducts(menu);

  function handleGuestChange(field: "name" | "phone" | "note") {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setGuest({ ...guest, [field]: event.target.value });
    };
  }

  function handlePay(): void {
    router.push(`/${locale}/paiement`);
  }

  const total = cartTotalCents(menu, lines);
  const canPay = channel !== null && lines.length > 0;

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
              return (
                <li key={line.lineId} className="ui-card">
                  <div className="ui-product-card__header">
                    <span>
                      {line.quantity}× {localize(product.name, locale)}
                    </span>
                    <span>{formatChf(lineTotalCents(product, line), locale)}</span>
                  </div>
                  {optionLabels.length > 0 ? (
                    <p className="ui-text-muted">{optionLabels.join(", ")}</p>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => removeLine(line.lineId)}>
                    {dictionary.removeLine}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

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
