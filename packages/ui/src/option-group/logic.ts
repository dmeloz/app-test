// Logique pure d'un groupe d'options (variantes, suppléments) — min/max, jamais de supplément
// présélectionné (AC-P01-04, AC-P01-05). Séparée du composant React (`OptionGroupField.tsx`) pour
// rester testable sans rendu (`.claude/rules/testing.md`).
export interface OptionChoice {
  readonly id: string;
  readonly label: string;
  /** Supplément en centimes (0 si inclus). Jamais négatif : ce n'est pas un calcul de prix final. */
  readonly priceCents: number;
}

export interface OptionGroupConfig {
  readonly id: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly choices: readonly OptionChoice[];
}

/**
 * Sélection initiale d'un groupe d'options : toujours vide. AC-P01-05 — aucun supplément payant
 * n'est présélectionné, quel que soit le groupe (y compris un groupe obligatoire, min ≥ 1) : c'est
 * au client de choisir, jamais un choix par défaut silencieux.
 */
export function getInitialSelection(_config: OptionGroupConfig): readonly string[] {
  return [];
}

/**
 * Ajoute ou retire un choix de la sélection courante. Un groupe `max === 1` se comporte comme un
 * groupe à choix unique (le nouveau choix remplace l'ancien). Au-delà de `max`, un ajout est ignoré
 * (AC-P01-04 : max=2 empêche une 3ᵉ sélection) ; retirer un choix déjà sélectionné est toujours permis.
 */
export function toggleSelection(
  config: OptionGroupConfig,
  current: readonly string[],
  choiceId: string,
): readonly string[] {
  const isSelected = current.includes(choiceId);
  if (isSelected) {
    return current.filter((id) => id !== choiceId);
  }
  if (config.max <= 1) {
    return [choiceId];
  }
  if (current.length >= config.max) {
    return current;
  }
  return [...current, choiceId];
}

/** AC-P01-04 : un groupe min=1 (ou plus) empêche l'ajout au panier sans sélection suffisante. */
export function isSelectionValid(config: OptionGroupConfig, current: readonly string[]): boolean {
  return current.length >= config.min && current.length <= config.max;
}

/** Vrai si un choix supplémentaire peut encore être ajouté (utile pour désactiver les cases restantes). */
export function canSelectMore(config: OptionGroupConfig, current: readonly string[]): boolean {
  return current.length < config.max;
}

/** Somme des suppléments des choix sélectionnés (affichage uniquement — jamais le total facturé). */
export function selectionSurchargeCents(
  config: OptionGroupConfig,
  current: readonly string[],
): number {
  return config.choices
    .filter((choice) => current.includes(choice.id))
    .reduce((sum, choice) => sum + choice.priceCents, 0);
}
