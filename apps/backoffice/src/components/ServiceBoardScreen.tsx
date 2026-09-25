"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { Button, OrderCard, type OrderStatus as UiOrderStatus } from "@app/ui";
import type { Locale } from "../i18n/dictionary";
import { localize } from "../mock/localize";
import type { BoardOrderStatus, MockOrder } from "../mock/types";
import { useServiceBoard } from "../state/service-board-store";

interface BoardDictionary {
  readonly heading: string;
  readonly columnNew: string;
  readonly columnPreparing: string;
  readonly columnReady: string;
  readonly noteLabel: string;
  readonly acceptLabel: string;
  readonly refuseLabel: string;
  readonly readyLabel: string;
  readonly confirmRefusalLabel: string;
  readonly cancelLabel: string;
  readonly refusalReasonLabel: string;
  readonly refusalReasonPlaceholder: string;
  readonly pauseButton: string;
  readonly resumeButton: string;
  readonly pausedNotice: string;
  readonly simulateButton: string;
  readonly emptyColumnMessage: string;
  readonly statusNew: string;
  readonly statusPreparing: string;
  readonly statusReady: string;
  readonly arrivalAnnouncement: string;
  readonly menuHeading: string;
  readonly soldOutToggleOn: string;
  readonly soldOutToggleOff: string;
}

export interface ServiceBoardScreenProps {
  readonly locale: Locale;
  readonly dictionary: BoardDictionary;
}

function toUiStatus(status: BoardOrderStatus): UiOrderStatus {
  if (status === "refused") {
    return "refused";
  }
  return status;
}

function statusLabel(status: BoardOrderStatus, dictionary: BoardDictionary): string {
  if (status === "new") {
    return dictionary.statusNew;
  }
  if (status === "preparing") {
    return dictionary.statusPreparing;
  }
  return dictionary.statusReady;
}

interface OrderColumnCardProps {
  readonly order: MockOrder;
  readonly locale: Locale;
  readonly dictionary: BoardDictionary;
  readonly onAccept?: () => void;
  readonly onReady?: () => void;
  readonly onRefuse: (reason: string) => void;
}

function OrderColumnCard({
  order,
  locale,
  dictionary,
  onAccept,
  onReady,
  onRefuse,
}: OrderColumnCardProps): ReactElement {
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="ui-stack ui-stack--sm">
      <OrderCard
        orderNumber={order.number}
        slotLabel={localize(order.slotLabel, locale)}
        status={toUiStatus(order.status)}
        statusLabel={statusLabel(order.status, dictionary)}
        lines={order.lines.map((line) => ({
          label: localize(line.name, locale),
          quantity: line.quantity,
          options: line.options.map((option) => localize(option, locale)),
        }))}
        note={order.note ? localize(order.note, locale) : undefined}
        noteLabel={dictionary.noteLabel}
        acceptLabel={onAccept ? dictionary.acceptLabel : undefined}
        onAccept={onAccept}
        readyLabel={onReady ? dictionary.readyLabel : undefined}
        onReady={onReady}
        refuseLabel={!refusing && order.status !== "ready" ? dictionary.refuseLabel : undefined}
        onRefuse={!refusing && order.status !== "ready" ? () => setRefusing(true) : undefined}
      />
      {refusing ? (
        <div className="ui-card ui-stack ui-stack--sm">
          <div className="ui-field">
            <label htmlFor={`refusal-reason-${order.id}`}>{dictionary.refusalReasonLabel}</label>
            <input
              id={`refusal-reason-${order.id}`}
              className="ui-input"
              value={reason}
              placeholder={dictionary.refusalReasonPlaceholder}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="ui-order-card__actions">
            <Button
              variant="danger"
              size="sm"
              disabled={reason.trim().length === 0}
              onClick={() => {
                onRefuse(reason.trim());
                setRefusing(false);
                setReason("");
              }}
            >
              {dictionary.confirmRefusalLabel}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRefusing(false)}>
              {dictionary.cancelLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Écran 4 (spec P01 §2) : tableau de service — colonnes Nouvelles / En préparation / Prêtes,
// Accepter / Refuser (motif) / Prête, pause des commandes, bascule rupture d'un produit, alerte
// visuelle à l'arrivée d'une commande fictive (inspiration R1 — `docs/design/inspirations.md`).
export function ServiceBoardScreen({ locale, dictionary }: ServiceBoardScreenProps): ReactElement {
  const board = useServiceBoard();
  const newOrders = board.orders.filter((order) => order.status === "new");
  const preparingOrders = board.orders.filter((order) => order.status === "preparing");
  const readyOrders = board.orders.filter((order) => order.status === "ready");

  return (
    <main className="ui-container">
      <div className="ui-stack">
        <h1 className="ui-heading-xl">{dictionary.heading}</h1>

        <div className="ui-order-card__actions">
          <Button variant={board.paused ? "primary" : "secondary"} onClick={board.togglePause}>
            {board.paused ? dictionary.resumeButton : dictionary.pauseButton}
          </Button>
          <Button variant="secondary" onClick={board.simulateIncomingOrder}>
            {dictionary.simulateButton}
          </Button>
        </div>
        {board.paused ? (
          <p role="status" className="ui-badge">
            {dictionary.pausedNotice}
          </p>
        ) : null}
        <div aria-live="polite" className="ui-visually-hidden">
          {board.lastArrivalId ? dictionary.arrivalAnnouncement : ""}
        </div>

        <div className="ui-board">
          <section className="ui-board__column">
            <h2 className="ui-board__column-title">
              {dictionary.columnNew} ({newOrders.length})
            </h2>
            {newOrders.length === 0 ? (
              <p className="ui-text-muted">{dictionary.emptyColumnMessage}</p>
            ) : null}
            {newOrders.map((order) => (
              <OrderColumnCard
                key={order.id}
                order={order}
                locale={locale}
                dictionary={dictionary}
                onAccept={() => board.acceptOrder(order.id)}
                onRefuse={(reason) => board.refuseOrder(order.id, reason)}
              />
            ))}
          </section>

          <section className="ui-board__column">
            <h2 className="ui-board__column-title">
              {dictionary.columnPreparing} ({preparingOrders.length})
            </h2>
            {preparingOrders.length === 0 ? (
              <p className="ui-text-muted">{dictionary.emptyColumnMessage}</p>
            ) : null}
            {preparingOrders.map((order) => (
              <OrderColumnCard
                key={order.id}
                order={order}
                locale={locale}
                dictionary={dictionary}
                onReady={() => board.markReady(order.id)}
                onRefuse={(reason) => board.refuseOrder(order.id, reason)}
              />
            ))}
          </section>

          <section className="ui-board__column">
            <h2 className="ui-board__column-title">
              {dictionary.columnReady} ({readyOrders.length})
            </h2>
            {readyOrders.length === 0 ? (
              <p className="ui-text-muted">{dictionary.emptyColumnMessage}</p>
            ) : null}
            {readyOrders.map((order) => (
              <OrderColumnCard
                key={order.id}
                order={order}
                locale={locale}
                dictionary={dictionary}
                onRefuse={(reason) => board.refuseOrder(order.id, reason)}
              />
            ))}
          </section>
        </div>

        <section className="ui-stack ui-stack--sm">
          <h2 className="ui-heading-lg">{dictionary.menuHeading}</h2>
          {board.menuItems.map((item) => (
            <div key={item.id} className="ui-slot">
              <span>{localize(item.name, locale)}</span>
              <Button
                variant={item.soldOut ? "danger" : "secondary"}
                size="sm"
                onClick={() => board.toggleSoldOut(item.id)}
              >
                {item.soldOut ? dictionary.soldOutToggleOff : dictionary.soldOutToggleOn}
              </Button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
