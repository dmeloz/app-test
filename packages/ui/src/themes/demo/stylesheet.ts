import { demoTheme } from "../../tokens/demo-theme.js";
import { tokensToCssVariables } from "../../tokens/to-css.js";

// Feuille de style du thème de démonstration : variables CSS générées depuis les tokens (ADR 0015)
// + règles des composants de `packages/ui`, toutes exprimées avec `var(--...)` (jamais de couleur ou
// de taille codée en dur ici). Injectée une fois par page via `<style nonce=...>` (voir
// `apps/*/src/app/[locale]/layout.tsx`) — la CSP à nonce du L00 est conservée : aucun style ni script
// tiers, aucune balise `style=""` en ligne dans les composants (un attribut `style` en ligne n'est
// pas couvert par un nonce CSP, seules les balises `<style>`/`<script>` le sont).
const COMPONENT_RULES = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--color-bg); color: var(--color-text);
  font-family: var(--font-family); font-size: var(--font-size-md); line-height: 1.5;
  -webkit-text-size-adjust: 100%; }
body { max-width: 100vw; overflow-x: hidden; }
a { color: var(--color-focus-ring); }
:focus-visible { outline: 3px solid var(--color-focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}

.ui-visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

.ui-banner {
  background: var(--color-banner-bg); color: var(--color-banner-text);
  font-weight: var(--font-weight-bold); text-align: center;
  padding: var(--space-sm) var(--space-md);
  position: sticky; top: 0; z-index: 40;
  border-bottom: 1px solid var(--color-border);
}

.ui-container {
  max-width: 480px; margin: 0 auto; padding: var(--space-md);
  padding-bottom: calc(96px + var(--space-md));
}

.ui-stack { display: flex; flex-direction: column; gap: var(--space-md); }
.ui-stack--sm { gap: var(--space-sm); }

.ui-heading-xl { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); margin: 0; }
.ui-heading-lg { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0; }
.ui-text-muted { color: var(--color-text-muted); }

.ui-button {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-xs);
  min-height: var(--min-tap-target); min-width: var(--min-tap-target);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md); border: 1px solid transparent;
  font-size: var(--font-size-md); font-weight: var(--font-weight-bold);
  cursor: pointer; text-decoration: none;
}
.ui-button:disabled, .ui-button[aria-disabled="true"] { cursor: not-allowed; opacity: 0.5; }
.ui-button--primary { background: var(--color-primary); color: var(--color-primary-contrast); }
.ui-button--primary:not(:disabled):hover { background: var(--color-primary-dark); }
.ui-button--secondary { background: var(--color-surface); color: var(--color-text); border-color: var(--color-border); }
.ui-button--danger { background: var(--color-danger); color: var(--color-danger-contrast); }
.ui-button--ghost { background: transparent; color: var(--color-text); border-color: var(--color-border); }
.ui-button--block { width: 100%; }
.ui-button--sm { min-height: 36px; padding: var(--space-xs) var(--space-sm); font-size: var(--font-size-sm); }

.ui-pill-nav { display: flex; gap: var(--space-xs); flex-wrap: wrap; }
.ui-pill {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: var(--min-tap-target); padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-pill); border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text); text-decoration: none;
  font-weight: var(--font-weight-bold); font-size: var(--font-size-sm);
}
.ui-pill[aria-current="true"], .ui-pill--active {
  background: var(--color-primary); color: var(--color-primary-contrast); border-color: var(--color-primary);
}

.ui-badge {
  display: inline-flex; align-items: center; gap: var(--space-xs);
  padding: 2px var(--space-sm); border-radius: var(--radius-pill);
  background: var(--color-surface-alt); color: var(--color-text);
  font-size: var(--font-size-sm); border: 1px solid var(--color-border);
}
.ui-badge--allergen { background: var(--color-surface-alt); }

.ui-status {
  display: inline-flex; align-items: center; gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md); border-radius: var(--radius-pill);
  font-weight: var(--font-weight-bold); font-size: var(--font-size-sm);
}
.ui-status--new { background: var(--color-status-new-bg); color: var(--color-status-new-text); }
.ui-status--preparing { background: var(--color-status-preparing-bg); color: var(--color-status-preparing-text); }
.ui-status--ready { background: var(--color-status-ready-bg); color: var(--color-status-ready-text); }
.ui-status--paused { background: var(--color-status-paused-bg); color: var(--color-status-paused-text); }
.ui-status--refused { background: var(--color-status-refused-bg); color: var(--color-status-refused-text); }

.ui-card {
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: var(--space-md); box-shadow: var(--shadow-sm);
}

.ui-product-card { padding: 0; overflow: hidden; }
.ui-product-card__photo {
  height: 96px; background: var(--color-surface-alt); color: var(--color-text-muted);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-sm); font-weight: var(--font-weight-bold);
  border-bottom: 1px solid var(--color-border);
}
.ui-product-card__body { padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-sm); }
.ui-product-card__header { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-sm); }
.ui-product-card__price { font-weight: var(--font-weight-bold); white-space: nowrap; }
.ui-product-card__allergens { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.ui-product-card--sold-out { opacity: 0.6; }
.ui-product-card--sold-out .ui-product-card__photo { background: var(--color-surface); }

.ui-option-group { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-sm) var(--space-md); }
.ui-option-group__legend { font-weight: var(--font-weight-bold); padding: 0 var(--space-xs); }
.ui-option-group__hint { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0 0 var(--space-xs) 0; }
.ui-option-group__choice {
  display: flex; align-items: center; gap: var(--space-sm);
  min-height: var(--min-tap-target); padding: var(--space-xs) 0;
}
.ui-option-group__choice input { width: 20px; height: 20px; flex-shrink: 0; }
.ui-option-group__choice label { flex: 1; }
.ui-option-group__error { color: var(--color-danger); font-size: var(--font-size-sm); }

.ui-cart-bar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-md);
  background: var(--color-bg); border-top: 1px solid var(--color-border); box-shadow: var(--shadow-md);
  padding: var(--space-sm) var(--space-md);
  padding-bottom: calc(var(--space-sm) + env(safe-area-inset-bottom, 0px));
}

.ui-order-card { display: flex; flex-direction: column; gap: var(--space-sm); }
.ui-order-card__header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-sm); }
.ui-order-card__number { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); }
.ui-order-card__lines { margin: 0; padding-left: 1.1em; }
.ui-order-card__actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
.ui-order-card__note { background: var(--color-surface); border-radius: var(--radius-sm); padding: var(--space-sm); }

.ui-board { display: flex; flex-direction: column; gap: var(--space-lg); }
.ui-board__column { display: flex; flex-direction: column; gap: var(--space-sm); }
.ui-board__column-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0; }

.ui-field { display: flex; flex-direction: column; gap: var(--space-xs); }
.ui-field label { font-weight: var(--font-weight-bold); }
.ui-input, .ui-textarea, .ui-select {
  min-height: var(--min-tap-target); border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  padding: var(--space-sm); font-size: var(--font-size-md); font-family: inherit; background: var(--color-bg);
  color: var(--color-text);
}
.ui-textarea { min-height: 80px; }

.ui-slot-list { display: flex; flex-direction: column; gap: var(--space-xs); }
.ui-slot {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm);
  min-height: var(--min-tap-target); padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg);
}
.ui-slot[aria-disabled="true"] { opacity: 0.5; }
.ui-slot[aria-current="true"] { border-color: var(--color-primary); border-width: 2px; }

.ui-stepper { display: flex; flex-direction: column; gap: var(--space-sm); }
.ui-stepper__step { display: flex; align-items: center; gap: var(--space-sm); }
.ui-stepper__dot {
  width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-border);
  flex-shrink: 0; background: var(--color-bg);
}
.ui-stepper__step--done .ui-stepper__dot { background: var(--color-primary); border-color: var(--color-primary); }
.ui-stepper__step--current .ui-stepper__dot { border-color: var(--color-primary); }
`;

export const DEMO_STYLESHEET = `${tokensToCssVariables(demoTheme)}\n${COMPONENT_RULES}`;
