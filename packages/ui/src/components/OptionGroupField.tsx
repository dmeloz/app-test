import type { ReactElement } from "react";
import { canSelectMore, type OptionGroupConfig } from "../option-group/logic.js";

export interface OptionGroupFieldProps {
  readonly config: OptionGroupConfig;
  readonly selected: readonly string[];
  readonly onToggle: (choiceId: string) => void;
  /** Formate un supplément (centimes) pour l'affichage — jamais calculé ici (`formatMoney`). */
  readonly formatSurcharge: (priceCents: number) => string;
  readonly hint: string;
  readonly errorText?: string;
  readonly showError?: boolean;
  readonly includedLabel: string;
}

// AC-P01-04/05 : un groupe `max === 1` se comporte comme un choix unique (boutons radio) ; sinon
// des cases à cocher, jamais présélectionnées (`getInitialSelection`, appelée par l'app appelante).
// Au-delà de `max`, les choix restants sont désactivés (renfort visuel de `toggleSelection`, qui
// ignore déjà l'ajout côté logique).
export function OptionGroupField({
  config,
  selected,
  onToggle,
  formatSurcharge,
  hint,
  errorText,
  showError = false,
  includedLabel,
}: OptionGroupFieldProps): ReactElement {
  const isSingleChoice = config.max <= 1;
  const canAddMore = canSelectMore(config, selected);

  return (
    <fieldset className="ui-option-group">
      <legend className="ui-option-group__legend">{config.label}</legend>
      <p className="ui-option-group__hint">{hint}</p>
      {config.choices.map((choice) => {
        const inputId = `${config.id}-${choice.id}`;
        const isChecked = selected.includes(choice.id);
        const isDisabled = !isChecked && !isSingleChoice && !canAddMore;
        return (
          <div className="ui-option-group__choice" key={choice.id}>
            <input
              type={isSingleChoice ? "radio" : "checkbox"}
              id={inputId}
              name={config.id}
              checked={isChecked}
              disabled={isDisabled}
              onChange={() => onToggle(choice.id)}
            />
            <label htmlFor={inputId}>
              {choice.label}
              {choice.priceCents > 0
                ? ` (+${formatSurcharge(choice.priceCents)})`
                : ` — ${includedLabel}`}
            </label>
          </div>
        );
      })}
      {showError && errorText ? (
        <p className="ui-option-group__error" role="alert">
          {errorText}
        </p>
      ) : null}
    </fieldset>
  );
}
