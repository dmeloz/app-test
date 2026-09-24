---
paths:
  - "apps/storefront/**/*"
  - "apps/backoffice/**/*"
  - "packages/ui/**/*"
---

# Règles frontend (Next.js App Router, PWA)

- Le navigateur affiche des montants calculés par le serveur (`/v1/quotes`) ; il ne calcule jamais un
  total faisant foi. Toute différence de prix est affichée explicitement, jamais silencieuse.
- Thème uniquement via design tokens CSS (`packages/ui/tokens`) ; aucun CSS arbitraire par tenant ;
  contraste AA vérifié automatiquement à la publication du thème.
- Mobile-first ; cibles tactiles ≥ 24×24 px CSS (viser 44×44) ; navigation clavier ; libellés ARIA ;
  tests axe automatisés sur les pages critiques.
- FR et EN : aucun texte en dur ; clés de traduction ; formats monétaires/dates via `Intl` (`fr-CH`, `en-CH`).
- Commande invité par défaut ; compte jamais imposé ; suppléments payants jamais présélectionnés ;
  « aucun » aussi visible que les autres choix de pourboire (si activé).
- Canal (retrait/livraison), délai, minimum et frais visibles avant le checkout ; total toujours visible.
- Panier conservé localement pendant la redirection de paiement ; aucune création de commande hors ligne.
- Service worker versionné ; menu hors ligne affiché avec avertissement ; mise à jour contrôlée.
- Pas d'analytics ni de traceur sans finalité, base juridique et consentement définis.
- Back-office : utilisable en plein service (peu d'étapes, états évidents, alertes sonores et visuelles).
