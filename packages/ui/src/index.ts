// ui — Design system et moteur de thème (tokens CSS). Lot P01 : thème et composants de démonstration
// (ADR 0015). Aucune donnée fictive n'est importée ici (AC-P01-11) : tous les composants reçoivent
// leurs textes et valeurs déjà résolus par l'app appelante.
export type { DesignTokens } from "./tokens/types.js";
export { demoTheme } from "./tokens/demo-theme.js";
export { tokensToCssVariables } from "./tokens/to-css.js";
export { contrastRatio, meetsAA, ContrastError } from "./tokens/contrast.js";
export { DEMO_STYLESHEET } from "./themes/demo/stylesheet.js";

export { formatMoney, MoneyFormatError, type DemoLocale } from "./format/money.js";

export {
  getInitialSelection,
  toggleSelection,
  isSelectionValid,
  canSelectMore,
  selectionSurchargeCents,
  type OptionChoice,
  type OptionGroupConfig,
} from "./option-group/logic.js";

export { DemoBanner, type DemoBannerProps } from "./components/DemoBanner.js";
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./components/Button.js";
export { StatusBadge, type StatusBadgeProps, type OrderStatus } from "./components/StatusBadge.js";
export { ProductCard, type ProductCardProps } from "./components/ProductCard.js";
export { OptionGroupField, type OptionGroupFieldProps } from "./components/OptionGroupField.js";
export { CartBar, type CartBarProps } from "./components/CartBar.js";
export { OrderCard, type OrderCardProps, type OrderCardLine } from "./components/OrderCard.js";
export { ThemeStyle, type ThemeStyleProps } from "./components/ThemeStyle.js";
export { Stepper, type StepperProps, type StepperStep } from "./components/Stepper.js";
export { SlotList, type SlotListProps, type SlotOption } from "./components/SlotList.js";
