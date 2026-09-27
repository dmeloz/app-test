"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { Button } from "@app/ui";
import { useCartStore } from "../state/cart-store";

export interface ResetDemoButtonProps {
  readonly label: string;
  readonly locale: string;
}

// M3 (audit-1.md) : bouton visible « Réinitialiser la démo » sur chaque page — remet l'état de
// démonstration (panier, créneau, coordonnées invité, commande) à zéro et purge `localStorage` en
// écrivant l'état initial, puis renvoie à l'accueil (nouveau départ visible, utile en rendez-vous).
export function ResetDemoButton({ label, locale }: ResetDemoButtonProps): ReactElement {
  const router = useRouter();
  const { resetDemo } = useCartStore();

  function handleReset(): void {
    resetDemo();
    router.push(`/${locale}`);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleReset}>
      {label}
    </Button>
  );
}
