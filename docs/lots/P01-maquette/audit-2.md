# Audit 2 (contre-audit) — Lot P01 (maquette cliquable) — 2026-09-27

> Rapport rendu par `auditor-opus` (sans outil d'écriture), enregistré tel quel par le fil principal.

- **Auditeur** : auditor-opus (contre-audit, lot non critique)
- **Périmètre** : `claude/lot-p01-maquette-bpjeoe`, `fdc3794..58fa77c` (tête `58fa77cd5cbc5c501c0a44a60a2966b39f1cb1e8`) — correctifs `814edc6`, `8daf04d`, `59a86b6`, `aad3f8f`, `58fa77c` ; documents `922585c`, `9b3d2f7`, `a988afd` ; 53 fichiers (+2563/−169).
- **Vérifications rejouées** (sorties réelles, ce conteneur, arbre propre avant/après) :
  - `pnpm install --frozen-lockfile --offline` → « Lockfile is up to date, resolution step is skipped ».
  - `pnpm format:check` → « All matched files use Prettier code style! » ; `pnpm lint` → 0, aucune sortie.
  - `pnpm test:lint-boundaries` → tests 18, pass 18, fail 0.
  - `bash .claude/hooks/test-guards.sh` → 0, 127 « ok », 0 FAIL ; `.claude/`, `CLAUDE.md`, `docs/process/`, `.github/` inchangés sur `fdc3794..58fa77c` (`git diff --quiet` → 0).
  - `pnpm turbo run typecheck --filter=@app/domain` → « Failed » (environnemental, I1 de l'audit-1) ; rejoué paquet par paquet : `typecheck` 10/10 → 0 ; `test` : domain 9, ui **47**, api 33, storefront **28**, backoffice **11** = 128 verts (5 paquets sans test, comme au L00) ; `build` : 8 paquets `tsc` → 0, `next build` storefront (6 routes ƒ + Proxy) et backoffice (2 routes ƒ + Proxy).
  - `CI=1 PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test --config e2e/playwright.config.ts` → **86 passed (40.0s)**, aucun flaky ni retry.
  - Sondes : Playwright contre `next start` (amorçage/réinitialisation du tableau de service, `/paiement` après commande, état stocké périmé, limite d'erreur déclenchée, mesure de tous les contrôles interactifs, `ariaSnapshot` du panier) ; `curl` (nonce `<script>`/`<style>`, `X-Robots-Tag`, 3 routes) ; Node (`formatMoney`/`Intl` sur 16 devises, liste blanche des tokens sur 9 valeurs limites) ; `next dev` dans une **copie** du dépôt (StrictMode, voir I2).
  - **Non vérifié ici** : orchestration turbo (CI) ; check `ci` sur `58fa77c` ; description de la PR ; ruleset `protection-main` (D-P01-3, fait déclaré) ; `global-error.tsx` en exécution.

## Critères d'acceptation (non-régression)

| AC | Statut | Preuve |
|---|---|---|
| AC-P01-01 | OK | `demo-viewport.spec.ts` : 5 routes storefront FR+EN, backoffice FR+EN, 4 états remplis — vert. |
| AC-P01-02 | OK | `demo-storefront-flow.spec.ts` vert. |
| AC-P01-03 | OK | `demo-backoffice-flow.spec.ts` vert (+ « Nouvelle arrivée ») ; sonde production : 1 seule commande amorcée (chargement, rechargement, EN). |
| AC-P01-04 | OK | `OptionGroupField.test.ts` rend le composant : 3e choix `disabled` à max=2, aucun à 1/2 (L5). |
| AC-P01-05 | OK | 6 `not.toBeChecked()` e2e + contre-épreuve du composant (`checked=""` absent). |
| AC-P01-06 | OK | `ProductCard.test.ts` inchangé, vert. |
| AC-P01-07 | OK | `demo-banner.spec.ts` vert ; `ResetDemoButton` rendu **hors** du bandeau (`layout.tsx`), bandeau toujours sans `<button>`. |
| AC-P01-08 | OK | Interceptions e2e vertes ; réinitialisation et limites d'erreur : navigations de même origine uniquement. |
| AC-P01-09 | OK (réserve N1) | axe : 12 écrans vides + 6 états remplis FR/EN → 0 serious/critical ; régression d'accessibilité non détectable par axe introduite (N1). |
| AC-P01-10 | OK hors turbo | Vert en exécution directe ; `ci` sur la tête fera foi. |
| AC-P01-11 | OK | Frontière 18/18 ; `packages/ui` n'importe aucun `mock/` ; le backoffice a son propre `mock/restaurant.ts`. |

**CSP à nonce intacte** : `proxy.ts`, `not-found.tsx`, `global-not-found.tsx`, `next.config.ts`, `ThemeStyle.tsx`, `package.json`, `pnpm-lock.yaml` inchangés ; `curl` `/fr/panier`, `/en/paiement`, backoffice `/fr` : 12/12 `<script>` et 1/1 `<style>` avec le nonce de la réponse, 0 `style=""`, `X-Robots-Tag: noindex, nofollow`. **`[locale]/error.tsx` exercé réellement** (`quantity: 1e16`, entier qui passe la validation, puis `MoneyFormatError` au rendu) : écran d'erreur FR/EN, 0 `securitypolicyviolation`, seul `[style]` du DOM = `NEXT-ROUTE-ANNOUNCER` (posé par CSSOM, autorisé), « Réessayer » remet à zéro et le panier se rend. `global-error.tsx` (2 apps) relu, non déclenché : ni `<style>`, ni attribut `style`, ni script en ligne — compatible CSP « par absence ».

## Suivi des constats audit-1 et security-1

| Constat | Statut | Preuve |
|---|---|---|
| **M1** cibles tactiles | **RÉSOLU** | `.ui-button--sm` n'écrase plus `min-height` ; labels d'option et `.ui-field label` à `min-height: var(--min-tap-target)` ; `demo-touch-targets.spec.ts` (6 écrans remplis) vert. Sonde exhaustive : seuls < 44 px les `input` radio/case 20×20 (« Dès que possible » 13×13), chacun associé à un label de 235–343×44 px qui l'active — cible combinée acceptable. Backoffice : 0 élément < 44 px. |
| **M2** frais et minimum | **RÉSOLU** (D-P01-4) | `mock/delivery.ts` : 350 et 2000 (centimes) ; `deliveryFeeCents`, `orderTotalCents`, `isBelowDeliveryMinimum` : 8 cas unitaires dont min−1/min/min+1 ; frais (livraison seulement) et manque affichés, « Payer » bloqué ; total `/paiement` avec frais ; `demo-cart-delivery.spec.ts` vert. Réserve : minimum non imposé sur `/paiement` (N2). |
| **M3** localStorage | **RÉSOLU** (réserve N3) | `loadStateFromStorage` valide en profondeur (types, statuts connus, entiers > 0) et purge la clé ; 6+6 unitaires ; `demo-corrupted-storage.spec.ts` (3 corruptions × 2 apps, 0 erreur console, clé purgée) vert ; « Réinitialiser la démo » FR/EN sur les 2 apps ; `error.tsx` compatible nonce vérifié en exécution. |
| **M4** décimales | **RÉSOLU pour le cas cité** (réserve N4) | `formatMoney(7,"JPY")` → `7 JPY` ; `formatMoney(1234,"BHD")` → `1.234 BHD` ; tests normalisant les espaces ICU. |
| L4 | RÉSOLU | Viewport/axe FR+EN + états remplis ; `security-headers.spec.ts` : 5 routes × 2 langues storefront + backoffice FR/EN ; `not.toBeChecked()` ; 3 phrases surestimées corrigées et signalées. |
| L5 | RÉSOLU | `OptionGroupField.test.ts`. |
| L6 | RÉSOLU | `expectTypeOf<DemoBannerProps>().toEqualTypeOf<{ readonly text: string }>()` (inclus dans `tsc --noEmit`). |
| L7 | RÉSOLU (I3) | `[[headers]] for="/*"` X-Robots-Tag ; non-épinglage du plugin assumé par écrit ; hypothèses pnpm/Corepack et Node ≥ 24.21.0 (`deploiement-netlify.md` points 4–5). |
| L8 | RÉSOLU | Écart consigné ; nom tiré de `restaurant.name` (storefront) / `RESTAURANT_NAME` (backoffice), plus dans les dictionnaires. |
| L9 | **RÉSOLU sur l'essentiel** (réserve N5) | `SAFE_TOKEN_VALUE_PATTERN` (`to-css.ts:24`) rejette `; { } < > : \ @ =` et le retour à la ligne ; tests `red;}</style><script>`, `}…url(javascript:…)`, `\n}` ; tailles en tokens (`size.*`). |
| L10 | **PARTIEL** | Quantité +/−, `asap \|\| slotId` au panier, `/paiement` panier vide avant commande, purge des lignes et coordonnées invité après paiement, surbrillance texte + couleur. Ouvert : N2. |
| L1, L2, L3 / S1 pts 2–3, S2, S3, S4 | **SORTIS** (D-P01-2) | `decisions-porteur.md` ; lot `G01-garde-fou/spec.md` PROPOSÉ, critique, AC-G01-01 à 05 ; aucun fichier de garde-fou/gouvernance modifié ; écarts connus. |
| S1 point 1 | DÉCLARÉ (D-P01-3) | Ruleset sans acteur de contournement : fait déclaré par le porteur, non vérifiable par l'agent, consigné comme tel. |
| S5 (= M3) | RÉSOLU | Voir M3. |
| S6 | RÉSOLU en partie | Purge après paiement (e2e) ; persistance jusqu'au paiement sans échéance — acceptable pour une maquette. |
| S7 (= L9) | RÉSOLU en partie | Voir N5 ; validation par type à faire avant les thèmes tenant (L05). |
| S8 Netlify | PARTIEL (I3) | Hypothèse « deploy previews publics / barre d'outils Netlify » et vérification `curl -I` après déploiement absentes de `deploiement-netlify.md`. |

**Correctif d'amorçage** (`service-board-store.tsx`, drapeau `autoSeeded` au niveau du module) — **sain en production** (sonde `next start`) : chargement → 1 ; 3 réinitialisations → 0 puis 1 (jamais 2) ; double-clic réinitialiser → 1 ; pause puis réinitialisation → 1 (pause remise à `false`) ; rechargement → 1 ; `/en` → 1 ; stockage vidé → 1 ; 0 erreur console. **Aucun état partagé fautif côté serveur** : module `"use client"`, `autoSeeded` modifié seulement dans `useEffect`/gestionnaire de clic, jamais au SSR ; `currentState` chargé seulement si `window` existe. **Diagnostic du rapport inexact** (N6) : la cause réelle est l'ajout en `59a86b6` d'un second consommateur du hook (`ResetDemoButton` dans le layout), chaque instance ayant son `useRef` → 2 minuteurs, 2 commandes (`git show 59a86b6`) ; pas une double passe de montage React en production. Le correctif traite bien cette cause. Mode dev : aucun amorçage sous StrictMode, antérieur au correctif (I1).

**D-P01-2 et la PR** : décision correctement consignée ; mais `implementation-report.md:122` (tableau « G4 »), `:32` (« dans la règle **et** dans le hook ») et `:343` (« hooks … renforcés — G4 ») ne sont pas nuancés en « partiellement bloqué » (N6). Description de la PR non vérifiable.

## Constats

### [MEDIUM] N1 — Régression d'accessibilité : quantité des lignes du panier non exposée aux technologies d'assistance
- **Emplacement** : `apps/storefront/src/components/CartScreen.tsx:119` (libellé `{line.quantity}× {nom}` → `{nom}` seul), `:135` (`<span className="ui-quantity-control__value" aria-hidden="true">`), `:130`, `:141` (`aria-label` identiques d'une ligne à l'autre).
- **Preuve** : `ariaSnapshot()` du panier (salade ×2, eau ×1) : `listitem: text: Salade de saison 18.00 CHF / button "Diminuer la quantité": − / button "Augmenter la quantité": + / button "Retirer"` puis `listitem: text: Eau pétillante 50 cl 4.50 CHF …` (mêmes libellés). Le « 2 » n'apparaît nulle part dans l'arbre d'accessibilité ; à `fdc3794`, « 2× Salade de saison » était exposé. axe ne le détecte pas.
- **Impact** : information visible non accessible par programme (WCAG 1.3.1, niveau A) ; boutons +/− non distinctifs (2.4.6) ; contraire à la spec P01 §2 (« libellés ARIA »). Introduit par le correctif L10.
- **Correctif** : retirer `aria-hidden` ou exposer la quantité (`aria-label` de ligne « nom — quantité q », ou texte visuellement masqué) ; boutons contextualisés (« Diminuer la quantité de Salade de saison ») ; idéalement `aria-live="polite"` sur la valeur.
- **Test** : e2e `toMatchAriaSnapshot(...)` ou `getByRole("button", { name: "Augmenter la quantité de Salade de saison" })` + assertion que « 2 » est exposé après « + ».

### [LOW] N2 — `/paiement` reste payable après une commande et ne vérifie ni minimum ni créneau (L10 partiel) ; commentaire contraire
- **Emplacement** : `apps/storefront/src/components/PaymentScreen.tsx:42` (`if (lines.length === 0 && !order)`) ; `apps/storefront/src/state/cart-store.tsx:272-273` (« ni source d'une seconde commande à 0 CHF si l'utilisateur revient en arrière sur `/paiement` »).
- **Preuve** (production) : livraison, entrecôte, paiement puis `goBack()` → `/fr/paiement` affiche « Montant (démonstration) : 3.50 CHF » panier vide ; « Confirmer » crée une seconde commande (`DEMO-MUJWKZGC` → `DEMO-MUJWL08N`) ; au retrait : 0.00 CHF. Accès direct à `/fr/paiement` avec un sous-total de 9 CHF en livraison (sous le minimum) → payable à 12.50 CHF.
- **Impact** : scénario L10 de l'audit-1 toujours reproductible par le geste le plus naturel (Retour) ; commentaire inexact (règles 13/14) ; aucun enjeu financier.
- **Correctif** : avertissement dès `lines.length === 0` (éviter le flash entre `confirmPayment()` et `router.push` : naviguer d'abord ou drapeau « confirmation en cours ») ; réappliquer `isBelowDeliveryMinimum` et `asap || slotId` (ou rediriger vers le panier) ; corriger le commentaire.
- **Test** : e2e « paiement, retour arrière → message panier vide, 0 bouton Confirmer » ; « livraison sous le minimum, accès direct `/paiement` → pas de bouton Confirmer ».

### [LOW] N3 — Validation M3 sans intégrité référentielle
- **Emplacement** : `apps/storefront/src/state/cart-store.tsx:59` (seul `typeof productId === "string"`) ; `CartScreen.tsx:101` (ligne sans produit ignorée à l'affichage).
- **Preuve** : `{lines:[{productId:"n-existe-pas",quantity:1,…}], slotId:"slot-zzz", asap:false}` → panier sans ligne ni message « vide », « Total : 0.00 CHF », `Payer` **activé** ; barre du menu « 1 · 0.00 CHF ».
- **Impact** : cas motivant M3 (mock modifié entre deux déploiements, clé `-v1` inchangée) ; pas de plantage, état incohérent.
- **Correctif** : filtrer au chargement (ou dans `CartScreen`/`canPay`) les lignes dont `productId` est absent du menu et le `slotId` inconnu ; ou incrémenter la clé à chaque changement du mock.
- **Test** : unitaire (produit inconnu → ligne écartée) ; e2e (message « panier vide », `Payer` désactivé).

### [LOW] N4 — M4 : `Intl` reflète le CLDR, pas l'ISO 4217 ni le PSP ; le commentaire affirme le contraire
- **Emplacement** : `packages/ui/src/format/money.ts:22` (« norme ISO 4217 »), `:43` (`maximumFractionDigits ?? 2`).
- **Preuve** (Node 22, ICU 78.2, CLDR 48) : HUF **0**, IDR 0, COP 0, IQD 0, ALL 0, LAK 0, MMK 0 (ISO 4217 : 2 ou 3 ; Stripe traite HUF à 2 décimales) ; code inconnu (`ABC`, `XXX`) → 2 en silence ; dépend de la version d'ICU. C'était la correction suggérée par l'audit-1 lui-même : incomplète.
- **Impact** : aucun en CHF/EUR ; à l'extension UE (HUF), un montant en fillér s'afficherait 100× trop grand. Latent pour L04/L05.
- **Correctif** (au plus tard au L04, dans `packages/domain`) : table explicite des décimales alignée ISO 4217 et PSP pour les devises supportées, ou type restreint `"CHF" | "EUR"` et refus des autres. Corriger le commentaire dès maintenant.
- **Test** : `formatMoney(100000, "HUF")` → `1 000 HUF` (ou `MoneyFormatError`) ; devise inconnue refusée.

### [LOW] N5 — L9 : liste blanche par caractères, pas par type
- **Emplacement** : `packages/ui/src/tokens/to-css.ts:24`.
- **Preuve** : acceptés : `"("`, `"\""`, `"var(--x"`, `"url(//evil.example/x.png)"`, `"expression(alert(1))"` ; rejetés : `"red;"`, `"</style>"`.
- **Impact** : pas d'évasion HTML (`<` refusé), `img-src 'self' blob: data:` bloque les chargements externes ; mais une `(` ou `"` non fermée avale le reste de la feuille injectée par `ThemeStyle` (un tenant casse son propre thème). Sans objet tant que le thème est statique.
- **Correctif** (avant tout thème tenant, L05 / S7) : validation par type (couleur, longueur, polices), refus de `url(`, `expression(`, `var(`, équilibre des parenthèses et guillemets.
- **Test** : rejet de `"("`, `"\""`, `"url(/x)"` ; acceptation des valeurs du thème de démo.

### [LOW] N6 — Exactitude documentaire
- **Emplacement / preuve** :
  - `apps/backoffice/src/state/service-board-store.tsx:157-161` et `implementation-report.md:419-425` attribuent l'amorçage double à « deux passes de montage même en production (observé ici) » ; `git show 59a86b6` montre deux consommateurs du hook (`ResetDemoButton` à `layout.tsx:70` et `ServiceBoardScreen`), chacun avec son `useRef` — mécanisme déterministe, sans rapport avec React.
  - `implementation-report.md:32`, `:122`, `:343` présentent G4 comme appliqué par le hook, sans la nuance « partiellement » exigée par D-P01-2.
  - `apps/storefront/netlify.toml:53` affirme comme un fait que `[[headers]]` s'applique « à toute réponse Netlify quelle que soit son origine » : hypothèse non vérifiable ici.
- **Impact** : règle 14 ; un lecteur pourrait retirer le drapeau de module ou surestimer G4.
- **Correctif** : reformuler commentaire et rapport (cause : plusieurs consommateurs du hook) ; « partiellement, voir D-P01-2 / G01 » aux trois passages G4 ; marquer « HYPOTHÈSE » la portée de `[[headers]]` et ajouter à `deploiement-netlify.md` la vérification `curl -I` d'une page et d'un asset après le premier déploiement (S8).

### [INFO]
- **I1 — Mode dev (StrictMode) : aucun amorçage automatique.** `reactStrictMode: true` ; sous `next dev` (copie), 0 commande après 3 s alors que l'hydratation fonctionne (« Simuler » → 1). Idem avec le code de `fdc3794` (`useRef`) : antérieur, non régressif. Cause : l'effet monte, se démonte (`clearTimeout`), remonte ; le garde est déjà à `true`. Correctif possible : remettre `autoSeeded = false` au nettoyage si le minuteur n'a pas tiré. Non bloquant (démo servie en build de production).
- **I2 — Hors périmètre, constaté pendant la sonde.** Dans `apps/backoffice`, `next dev` (Next 16.3.6) génère `AGENTS.md` et `CLAUDE.md` (`@AGENTS.md`) et réécrit `next-env.d.ts` (suivi par git) ; l'`AGENTS.md` généré incite à le commiter. Un `CLAUDE.md` imbriqué produit par un outil tiers serait chargé comme instructions d'agent. Recommandation (G01 ou L00-suivi) : `agentRules: false` dans les deux `next.config.ts` ou ces fichiers au `.gitignore`, et interdiction de les commiter sans revue.
- **I3 — Netlify (S8).** Hypothèse « deploy previews / branch deploys publics et barre d'outils Netlify (script tiers bloqué par la CSP) » absente de `deploiement-netlify.md` ; à ajouter avec N6.
- **I4 — Turbo.** « Exec format error » (environnemental) ; la fusion s'appuie sur `ci` + `docker-api` verts **sur `58fa77c`** (qui modifie les `netlify.toml`, hors exception « documentation seule »).
- **I5 — Pages d'erreur.** Deux `<h1>` (FR puis EN) dans `error.tsx`, lien en dur vers `/fr` : acceptable pour une page de dernier recours.

## Verdict

**CHANGES_REQUIRED** — aucun BLOCKER ni HIGH. M1–M4 résolus avec preuves rejouées (86 e2e, 128 unitaires, typecheck/build directs, lint, frontières, hooks 127/127, CSP à nonce intacte y compris sur `error.tsx` déclenché réellement) ; correctif d'amorçage sain en production ; D-P01-2 correctement consignée. Mais le correctif L10 introduit une régression d'accessibilité de niveau A (**N1, MEDIUM**) et le scénario « seconde commande sur `/paiement` » reste reproductible avec un commentaire contraire (N2). À corriger : N1 (obligatoire), N2 et N6 dans la même boucle ; N3–N5 planifiables (N4/N5 au plus tard L04/L05). Puis contre-audit restreint (audit-3) et `ci` + `docker-api` verts sur la nouvelle tête.

## Note du fil principal (Opus)

- CI `ci` + `docker-api` **verts sur `58fa77c`** (vérifié via l'API GitHub après ce rapport) → I4 levé pour cette tête.
- I2 reporté dans la spec du lot G01 (garde-fou) : fichiers d'instructions d'agent générés par un outil tiers.
