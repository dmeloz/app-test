"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { Button } from "@app/ui";
import type { Locale } from "../i18n/dictionary";
import { formatChf } from "../mock/format";
import type { MockCategory } from "../mock/types";
import { cartTotalCents } from "../state/cart-calculations";
import { useCartStore } from "../state/cart-store";

interface PaymentDictionary {
  readonly heading: string;
  readonly notice: string;
  readonly totalLabel: string;
  readonly confirmButton: string;
}

export interface PaymentScreenProps {
  readonly locale: Locale;
  readonly dictionary: PaymentDictionary;
  readonly menu: readonly MockCategory[];
}

// « Paiement simulé — démonstration » (spec P01 §2) : aucun SDK Stripe, aucune donnée de carte,
// aucun montant réellement facturé (règles n°3 et n°1 du CLAUDE.md — hors périmètre P01 de toute
// façon, spec §2 « Exclu »).
export function PaymentScreen({ locale, dictionary, menu }: PaymentScreenProps): ReactElement {
  const router = useRouter();
  const { lines, confirmPayment } = useCartStore();
  const total = cartTotalCents(menu, lines);

  function handleConfirm(): void {
    confirmPayment();
    router.push(`/${locale}/suivi`);
  }

  return (
    <main className="ui-container">
      <div className="ui-stack">
        <h1 className="ui-heading-xl">{dictionary.heading}</h1>
        <p role="status">{dictionary.notice}</p>
        <p className="ui-heading-lg">
          {dictionary.totalLabel} : {formatChf(total, locale)}
        </p>
        <Button onClick={handleConfirm} block>
          {dictionary.confirmButton}
        </Button>
      </div>
    </main>
  );
}
