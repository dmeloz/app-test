import type { ReactElement } from "react";

export interface SlotOption {
  readonly id: string;
  readonly label: string;
  readonly available: boolean;
}

export interface SlotListProps {
  readonly slots: readonly SlotOption[];
  readonly selectedId: string | null;
  readonly onSelect: (slotId: string) => void;
  readonly unavailableLabel: string;
}

// Liste de créneaux (spec P01 §2, écran « Panier et créneau ») — un créneau complet (`available:
// false`) reste visible mais non sélectionnable (jamais masqué : le client comprend pourquoi son
// horaire préféré n'est pas proposé).
export function SlotList({
  slots,
  selectedId,
  onSelect,
  unavailableLabel,
}: SlotListProps): ReactElement {
  return (
    <div className="ui-slot-list" role="radiogroup">
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          className="ui-slot"
          role="radio"
          aria-checked={slot.id === selectedId}
          aria-current={slot.id === selectedId || undefined}
          aria-disabled={!slot.available}
          disabled={!slot.available}
          onClick={() => onSelect(slot.id)}
        >
          <span>{slot.label}</span>
          {!slot.available ? <span className="ui-text-muted">{unavailableLabel}</span> : null}
        </button>
      ))}
    </div>
  );
}
