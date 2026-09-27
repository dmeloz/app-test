"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { Button } from "@app/ui";
import type { Locale } from "../i18n/dictionary";
import { formatChf } from "../mock/format";
import type { MockCategory } from "../mock/types";
import {
  cartTotalCents,
  isBelowDeliveryMinimum,
  orderTotalCents,
} from "../state/cart-calculations";
import { useCartStore } from "../state/cart-store";

interface PaymentDictionary {
  readonly heading: string;
  readonly notice: string;
  readonly totalLabel: string;
  readonly confirmButton: string;
  readonly emptyCartWarning: string;
  readonly backToMenu: string;
  readonly notPayableWarning: string;
  readonly backToCart: string;
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
  const { channel, lines, slotId, asap, confirmPayment } = useCartStore();
  // N2 (audit-2.md) : drapeau local « confirmation en cours » — pas un état partagé (le panier reste
  // le seul état partagé, cf. `cart-store.tsx`). Il ne sert qu'à ne pas afficher un panier vide entre
  // `confirmPayment()` (qui vide `lines` immédiatement) et la navigation effective vers `/suivi` —
  // jamais à autoriser une seconde confirmation : le bouton est aussi désactivé pendant ce délai.
  const [isConfirming, setIsConfirming] = useState(false);
  const subtotal = cartTotalCents(menu, lines);
  const total = orderTotalCents(menu, lines, channel);
  const belowMinimum = isBelowDeliveryMinimum(subtotal, channel);
  // N2 (audit-2.md) : mêmes conditions que « Payer » au panier (`CartScreen`, `canPay`) — un canal
  // choisi, un panier non vide, le minimum de livraison atteint, et un créneau choisi ou « dès que
  // possible ». Sans elles, aucune confirmation n'est proposée ici, y compris à l'accès direct par
  // l'URL (le lien « Payer » du panier n'est alors plus le seul chemin possible vers cette page).
  const canConfirm =
    channel !== null && lines.length > 0 && !belowMinimum && (asap || slotId !== null);

  function handleConfirm(): void {
    setIsConfirming(true);
    confirmPayment();
    router.push(`/${locale}/suivi`);
  }

  // L10 (audit-1.md), corrigé par N2 (audit-2.md) : `/paiement` avec un panier vide — à l'accès
  // direct par l'URL avant toute commande, **ou après une commande suivie d'un retour arrière** (le
  // panier reste vide, `!order` ne suffisait pas à le détecter) — affiche un message plutôt qu'un
  // montant payable. `isConfirming` protège uniquement la transition vers `/suivi` juste ci-dessus.
  if (!isConfirming && lines.length === 0) {
    return (
      <main className="ui-container">
        <div className="ui-stack">
          <h1 className="ui-heading-xl">{dictionary.heading}</h1>
          <p role="alert">{dictionary.emptyCartWarning}</p>
          <a className="ui-button ui-button--secondary" href={`/${locale}/menu`}>
            {dictionary.backToMenu}
          </a>
        </div>
      </main>
    );
  }

  // N2 (audit-2.md) : accès direct à `/paiement` avec un panier non vide mais qui ne remplirait pas
  // les conditions de « Payer » (minimum de livraison non atteint, ni créneau ni « dès que possible »
  // choisi) — jamais de confirmation possible ici non plus.
  if (!isConfirming && !canConfirm) {
    return (
      <main className="ui-container">
        <div className="ui-stack">
          <h1 className="ui-heading-xl">{dictionary.heading}</h1>
          <p role="alert">{dictionary.notPayableWarning}</p>
          <a className="ui-button ui-button--secondary" href={`/${locale}/panier`}>
            {dictionary.backToCart}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-container">
      <div className="ui-stack">
        <h1 className="ui-heading-xl">{dictionary.heading}</h1>
        <p role="status">{dictionary.notice}</p>
        <p className="ui-heading-lg">
          {dictionary.totalLabel} : {formatChf(total, locale)}
        </p>
        <Button onClick={handleConfirm} disabled={isConfirming} block>
          {dictionary.confirmButton}
        </Button>
      </div>
    </main>
  );
}
