"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import type { Locale } from "../i18n/dictionary";
import type { Channel, MockRestaurant } from "../mock/types";
import { useCartStore } from "../state/cart-store";

interface HomeDictionary {
  readonly heading: string;
  readonly statusOpen: string;
  readonly statusClosed: string;
  readonly estimatedDelayPrefix: string;
  readonly estimatedDelaySuffix: string;
  readonly channelHeading: string;
  readonly channelPickup: string;
  readonly channelDelivery: string;
  readonly addressLabel: string;
  readonly hoursLabel: string;
  readonly seeMenu: string;
}

export interface HomeScreenProps {
  readonly locale: Locale;
  readonly dictionary: HomeDictionary;
  readonly restaurant: MockRestaurant;
  readonly tagline: string;
  readonly openingHours: string;
}

export function HomeScreen({
  locale,
  dictionary,
  restaurant,
  tagline,
  openingHours,
}: HomeScreenProps): ReactElement {
  const router = useRouter();
  const { channel, setChannel } = useCartStore();

  function chooseChannel(next: Channel): void {
    setChannel(next);
    router.push(`/${locale}/menu`);
  }

  return (
    <main className="ui-container">
      <div className="ui-stack">
        <h1 className="ui-heading-xl">{dictionary.heading}</h1>
        <p className="ui-text-muted">{tagline}</p>
        <p>
          <span
            className={`ui-status ${restaurant.isOpen ? "ui-status--ready" : "ui-status--paused"}`}
          >
            {restaurant.isOpen ? dictionary.statusOpen : dictionary.statusClosed}
          </span>
        </p>
        <p>
          {dictionary.estimatedDelayPrefix} {restaurant.estimatedDelayMinutes}{" "}
          {dictionary.estimatedDelaySuffix}
        </p>

        <div className="ui-card ui-stack ui-stack--sm">
          <h2 className="ui-heading-lg">{dictionary.channelHeading}</h2>
          <div className="ui-pill-nav" role="group" aria-label={dictionary.channelHeading}>
            <button
              type="button"
              className="ui-pill"
              aria-current={channel === "pickup" || undefined}
              onClick={() => chooseChannel("pickup")}
            >
              {dictionary.channelPickup}
            </button>
            <button
              type="button"
              className="ui-pill"
              aria-current={channel === "delivery" || undefined}
              onClick={() => chooseChannel("delivery")}
            >
              {dictionary.channelDelivery}
            </button>
          </div>
        </div>

        <div className="ui-card ui-stack ui-stack--sm">
          <p>
            <strong>{dictionary.addressLabel} : </strong>
            {restaurant.address}
          </p>
          <p>
            <strong>{dictionary.hoursLabel} : </strong>
            {openingHours}
          </p>
        </div>

        <a className="ui-button ui-button--secondary ui-button--block" href={`/${locale}/menu`}>
          {dictionary.seeMenu}
        </a>
      </div>
    </main>
  );
}
