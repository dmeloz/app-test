// provisoire — remplacé par packages/contracts au L04
//
// Créneaux fictifs de retrait/livraison — l'un d'eux est complet (`available: false`), affiché mais
// non sélectionnable (spec P01 §2, écran « Panier et créneau »).
import type { MockSlot } from "./types";

export const slots: readonly MockSlot[] = [
  { id: "slot-1", label: { fr: "18 h 00 – 18 h 15", en: "6:00 – 6:15 PM" }, available: true },
  { id: "slot-2", label: { fr: "18 h 15 – 18 h 30", en: "6:15 – 6:30 PM" }, available: true },
  { id: "slot-3", label: { fr: "18 h 30 – 18 h 45", en: "6:30 – 6:45 PM" }, available: false },
  { id: "slot-4", label: { fr: "18 h 45 – 19 h 00", en: "6:45 – 7:00 PM" }, available: true },
  { id: "slot-5", label: { fr: "19 h 00 – 19 h 15", en: "7:00 – 7:15 PM" }, available: true },
];
