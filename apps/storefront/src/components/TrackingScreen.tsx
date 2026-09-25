"use client";

import type { ReactElement } from "react";
import { Button, Stepper } from "@app/ui";
import type { Locale } from "../i18n/dictionary";
import { useCartStore } from "../state/cart-store";

interface TrackingDictionary {
  readonly heading: string;
  readonly orderNumberLabel: string;
  readonly stepAccepted: string;
  readonly stepPreparing: string;
  readonly stepReady: string;
  readonly advanceButton: string;
  readonly readyMessage: string;
  readonly noOrderMessage: string;
  readonly backToHome: string;
}

export interface TrackingScreenProps {
  readonly locale: Locale;
  readonly dictionary: TrackingDictionary;
}

// Suivi de commande (spec P01 §2) : Acceptée → En préparation → Prête, avancée manuellement ici
// (choix de démonstration documenté dans `docs/lots/P01-maquette/implementation-report.md` — un
// minuteur automatique rendrait le parcours e2e non déterministe).
export function TrackingScreen({ locale, dictionary }: TrackingScreenProps): ReactElement {
  const { order, advanceOrder } = useCartStore();

  if (!order) {
    return (
      <main className="ui-container">
        <div className="ui-stack">
          <h1 className="ui-heading-xl">{dictionary.heading}</h1>
          <p>{dictionary.noOrderMessage}</p>
          <a className="ui-button ui-button--secondary" href={`/${locale}`}>
            {dictionary.backToHome}
          </a>
        </div>
      </main>
    );
  }

  const steps = [
    { id: "accepted", label: dictionary.stepAccepted },
    { id: "preparing", label: dictionary.stepPreparing },
    { id: "ready", label: dictionary.stepReady },
  ];

  return (
    <main className="ui-container">
      <div className="ui-stack">
        <h1 className="ui-heading-xl">{dictionary.heading}</h1>
        <p>
          {dictionary.orderNumberLabel} : {order.id}
        </p>
        <Stepper steps={steps} currentStepId={order.status} />
        {order.status === "ready" ? (
          <p role="status">{dictionary.readyMessage}</p>
        ) : (
          <Button onClick={advanceOrder}>{dictionary.advanceButton}</Button>
        )}
        <a className="ui-button ui-button--secondary" href={`/${locale}`}>
          {dictionary.backToHome}
        </a>
      </div>
    </main>
  );
}
