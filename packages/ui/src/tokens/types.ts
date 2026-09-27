// Design tokens (ADR 0015) : un thème est un document de valeurs sémantiques converti en variables
// CSS par `tokensToCssVariables` (voir `./to-css.ts`). Aucune couleur, taille ou rayon n'est codé en
// dur ailleurs dans `packages/ui` : tous les composants référencent `var(--...)`.
export interface DesignTokens {
  readonly color: {
    readonly bg: string;
    readonly surface: string;
    readonly surfaceAlt: string;
    readonly text: string;
    readonly textMuted: string;
    readonly border: string;
    readonly primary: string;
    readonly primaryDark: string;
    readonly primaryContrast: string;
    readonly danger: string;
    readonly dangerContrast: string;
    readonly focusRing: string;
    readonly banner: {
      readonly bg: string;
      readonly text: string;
    };
    readonly status: {
      readonly new: { readonly bg: string; readonly text: string };
      readonly preparing: { readonly bg: string; readonly text: string };
      readonly ready: { readonly bg: string; readonly text: string };
      readonly paused: { readonly bg: string; readonly text: string };
      readonly refused: { readonly bg: string; readonly text: string };
    };
  };
  readonly radius: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly pill: string;
  };
  readonly space: {
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
  };
  readonly font: {
    readonly family: string;
    readonly sizeSm: string;
    readonly sizeMd: string;
    readonly sizeLg: string;
    readonly sizeXl: string;
    readonly weightRegular: string;
    readonly weightBold: string;
  };
  readonly shadow: {
    readonly sm: string;
    readonly md: string;
  };
  readonly minTapTarget: string;
  // L9 (audit-1.md) : tailles auparavant codées en dur dans la feuille de style (checkbox/radio,
  // photo de produit, largeur maximale du conteneur, dégagement de la barre de panier fixe) —
  // désormais des tokens comme le reste (ADR 0015 : « tokens uniquement »).
  readonly size: {
    readonly checkbox: string;
    readonly productPhotoHeight: string;
    readonly containerMaxWidth: string;
    readonly cartBarClearance: string;
  };
}
