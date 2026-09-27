"use client";

import type { ReactElement } from "react";
import { Button } from "@app/ui";
import { useServiceBoard } from "../state/service-board-store";

export interface ResetDemoButtonProps {
  readonly label: string;
}

// M3 (audit-1.md) : bouton visible « Réinitialiser la démo » — remet le tableau de service (commandes,
// pause, ruptures de stock) à l'état initial et purge `localStorage` en écrivant l'état initial.
export function ResetDemoButton({ label }: ResetDemoButtonProps): ReactElement {
  const { resetDemo } = useServiceBoard();

  return (
    <Button variant="ghost" size="sm" onClick={resetDemo}>
      {label}
    </Button>
  );
}
