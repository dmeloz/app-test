import type { ReactElement } from "react";

export interface StepperStep {
  readonly id: string;
  readonly label: string;
}

export interface StepperProps {
  readonly steps: readonly StepperStep[];
  readonly currentStepId: string;
}

// Suivi de commande (spec P01 §2, écran « Panier et créneau » → suivi) : Acceptée → En préparation →
// Prête. `aria-current="step"` sur l'étape courante (norme WAI-ARIA pour les indicateurs d'étape).
export function Stepper({ steps, currentStepId }: StepperProps): ReactElement {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);
  return (
    <ol className="ui-stepper" aria-label="progression">
      {steps.map((step, index) => {
        const isDone = currentIndex >= 0 && index < currentIndex;
        const isCurrent = step.id === currentStepId;
        const classes = [
          "ui-stepper__step",
          isDone ? "ui-stepper__step--done" : "",
          isCurrent ? "ui-stepper__step--current" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <li key={step.id} className={classes} aria-current={isCurrent ? "step" : undefined}>
            <span className="ui-stepper__dot" aria-hidden="true" />
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
