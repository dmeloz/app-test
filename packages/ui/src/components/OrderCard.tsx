import type { ReactElement } from "react";
import { StatusBadge, type OrderStatus } from "./StatusBadge.js";
import { Button } from "./Button.js";

export interface OrderCardLine {
  readonly label: string;
  readonly quantity: number;
  readonly options: readonly string[];
}

export interface OrderCardProps {
  readonly orderNumber: string;
  readonly slotLabel: string;
  readonly status: OrderStatus;
  readonly statusLabel: string;
  readonly lines: readonly OrderCardLine[];
  readonly note?: string;
  readonly noteLabel: string;
  readonly acceptLabel?: string;
  readonly refuseLabel?: string;
  readonly readyLabel?: string;
  readonly onAccept?: () => void;
  readonly onRefuse?: () => void;
  readonly onReady?: () => void;
}

// Carte de commande du tableau de service (spec P01 §2, écran 4 ; inspiration R1 —
// `docs/design/inspirations.md`) : texte + couleur pour le statut (jamais la couleur seule),
// actions Accepter / Refuser / Prête selon l'état (le contenu de `apps/backoffice` décide quelles
// actions sont pertinentes pour l'état courant en ne passant que les callbacks utiles).
export function OrderCard({
  orderNumber,
  slotLabel,
  status,
  statusLabel,
  lines,
  note,
  noteLabel,
  acceptLabel,
  refuseLabel,
  readyLabel,
  onAccept,
  onRefuse,
  onReady,
}: OrderCardProps): ReactElement {
  return (
    <article className="ui-card ui-order-card" aria-label={`${orderNumber} — ${statusLabel}`}>
      <div className="ui-order-card__header">
        <span className="ui-order-card__number">{orderNumber}</span>
        <StatusBadge status={status} label={statusLabel} />
      </div>
      <p className="ui-text-muted">{slotLabel}</p>
      <ul className="ui-order-card__lines">
        {lines.map((line, index) => (
          <li key={`${line.label}-${index}`}>
            {line.quantity}× {line.label}
            {line.options.length > 0 ? ` — ${line.options.join(", ")}` : ""}
          </li>
        ))}
      </ul>
      {note ? (
        <p className="ui-order-card__note">
          <strong>{noteLabel}</strong> {note}
        </p>
      ) : null}
      <div className="ui-order-card__actions">
        {onAccept && acceptLabel ? (
          <Button variant="primary" size="sm" onClick={onAccept}>
            {acceptLabel}
          </Button>
        ) : null}
        {onReady && readyLabel ? (
          <Button variant="primary" size="sm" onClick={onReady}>
            {readyLabel}
          </Button>
        ) : null}
        {onRefuse && refuseLabel ? (
          <Button variant="danger" size="sm" onClick={onRefuse}>
            {refuseLabel}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
