# Audit 1 — Lot P01 (maquette cliquable) + suivi audit-7 L00 — 2026-09-27

> Rapport rendu par `auditor-opus` (sans outil d'écriture) et enregistré tel quel par le fil principal.

- **Auditeur** : auditor-opus (audit allégé, lot non critique)
- **Périmètre** : branche `claude/lot-p01-maquette-bpjeoe`, `ff3cd3e..fdc3794` (9 commits, 85 fichiers), dont `80954d6` (G1-G4, N17, M15).
- **Vérifications rejouées** (sorties réelles, ce conteneur) :
  - `pnpm install --frozen-lockfile --offline` → « Lockfile is up to date, resolution step is skipped ».
  - `pnpm format:check` → « All matched files use Prettier code style! » (0) ; `pnpm lint` → 0, aucune sortie.
  - `pnpm test:lint-boundaries` → tests 18, pass 18, fail 0.
  - `bash .claude/hooks/test-guards.sh` → code 0, 127 lignes « ok », aucun FAIL.
  - `pnpm turbo run typecheck --filter=@app/domain` → « Failed: @app/domain#typecheck » (environnemental, paquet L00 non modifié) → turbo **non vérifié ici**.
  - `typecheck` paquet par paquet (10) → tous 0 ; `test` direct → domain 9, ui 37, api 33, storefront 14, backoffice 4 passés (autres paquets sans fichier de test, déjà le cas au L00) ; `build` direct → 8 paquets tsc 0, `next build` storefront (6 routes ƒ) et backoffice (2 routes ƒ).
  - `CI=1 PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test --config e2e/playwright.config.ts` → **41 passed (16.1s)**.
  - Sondes supplémentaires : Playwright contre `next start` (EN, livraison, panier rempli, commande en suivi, backoffice EN 4 commandes + formulaire de refus, localStorage corrompu, mesure des cibles tactiles), `curl` du HTML servi (`style=""`, URL externes), hook G4/N17 contre variantes de contournement, ancien hook (`ff3cd3e`) vs nouveau.

## Critères d'acceptation

| AC | Statut | Preuve |
|---|---|---|
| AC-P01-01 | OK | `demo-viewport.spec.ts` 8/8 ; test fiable (élément de 900 px injecté → scrollWidth 916 > 375, `overflow-x:hidden` ne masque pas). Sonde : EN menu, panier rempli, paiement, suivi avec commande, backoffice EN 4 commandes → 375/375. Couverture du test : L4. |
| AC-P01-02 | OK | `demo-storefront-flow.spec.ts` vert ; collecte console + `pageerror` ; ajout refusé sans cuisson. |
| AC-P01-03 | OK | `demo-backoffice-flow.spec.ts` vert : amorçage 300 ms, Accepter → Prête, Pause (`role=status` « en pause »). |
| AC-P01-04 | OK (réserve L5) | `option-group/logic.test.ts` ; sonde : « Avocat » `disabled` après 2 suppléments. Test de la logique, pas du composant (AC : « du composant »). |
| AC-P01-05 | OK | `getInitialSelection` renvoie toujours `[]`, seul point d'initialisation (`MenuScreen.tsx`). Vérification e2e annoncée par le rapport inexistante (L4). |
| AC-P01-06 | OK | `ProductCard.test.ts` : allergènes dans le balisage rendu, contenu enfant masqué en rupture. |
| AC-P01-07 | OK | `demo-banner.spec.ts` 13/13 ; bandeau `position: sticky`, sonde : top 0 après défilement ; aucun `<button>` ni prop de fermeture. |
| AC-P01-08 | OK | Interception `page.on("request")` dans les deux parcours → 0 hors origine ; sonde EN livraison + backoffice → 0 ; HTML servi sans URL `http(s)://` externe ; aucun SDK Stripe (grep). |
| AC-P01-09 | OK (réserve L4) | 6/6, mais états vides FR seulement. Sonde axe états remplis (menu + barre panier, panier + créneaux, paiement, suivi, backoffice + formulaire de refus, FR+EN) → 0 violation tous impacts. |
| AC-P01-10 | OK hors turbo, à confirmer en CI | Tout vert en exécution directe ; orchestration turbo cassée dans ce conteneur (I1) ; check `ci` sur la tête fera foi. |
| AC-P01-11 | OK | Seule la fixture importe un `mock/` depuis `packages/*` (grep) ; règle `import-x/no-restricted-paths` prouvée (18e cas). |

Transverses : CSP à nonce L00 intacte (`proxy.ts` inchangé ; une seule `<style nonce>` par page, 0 attribut `style=""`, curl 7 routes) · `dangerouslySetInnerHTML` : une occurrence (`ThemeStyle.tsx:14`) sur constante statique du paquet, justifiée · localStorage sous try/catch mais forme non validée (M3) · montants entiers + `Intl` fr-CH/en-CH · aucune donnée personnelle dans les mocks, adresse « (fictif) » · dépendances : `@axe-core/playwright@4.13.0` (dev racine, lockfile cohérent), `react`/`react-dom` 19.3.0 peer+dev de `packages/ui` (mêmes versions que les apps), `@app/ui` workspace ; aucune nouvelle dépendance de production externe.

Suivi audit-7 (`80954d6`) : **G1** conforme (règle 11, `workflow-lots.md` étape 7 + tableau, DoD) · **G2** conforme sur le fond, risque de brèche (L2) · **G3** conforme · **G4** présent (règle + hook) mais hook contournable (L1) · **N17** conforme et fidèle à bash (terminateur `EOF ` ou indenté ne ferme plus un `<<` ; `<<-` ne retire que les tabulations ; 5 cas passent) · **M15** conforme · **aucun relâchement** : règle 11 strictement plus exigeante ; l'exception « documentation seule » reprend mot pour mot G2 de l'audit-7.

## Constats

### [MEDIUM] M1 — Cibles tactiles < 44×44 px (exigence explicite spec §2)
- **Emplacement** : `packages/ui/src/themes/demo/stylesheet.ts:62` (`.ui-button--sm { min-height: 36px }`), `:121` (inputs 20×20) ; `packages/ui/src/components/OptionGroupField.tsx:51` (`<label>` 24 px) ; `apps/backoffice/src/components/ServiceBoardScreen.tsx:116,126,232` (`size="sm"`).
- **Preuve** : mesures à 375 px — menu : radios/cases 20×20, labels 235×24 (ligne 44 px, seuls input+label cliquables) ; backoffice : « Accepter » 78×36, « Refuser » 70×36, bascules rupture 36–42 px. axe ne le détecte pas (`target-size` hors tags testés).
- **Impact** : écran cuisine = usage rapide, doigts gras ; spec enfreinte.
- **Correctif** : `min-height: var(--min-tap-target)` pour toutes les variantes de bouton ; label d'option `display:flex; min-height: var(--min-tap-target)` (ou ligne entière cliquable).
- **Test** : e2e mesurant `getBoundingClientRect()` de chaque `button, a, label[for]` visible sur les 4 écrans, ≥ 44×44.

### [MEDIUM] M2 — « Frais et minimum affichés » absents, écart non documenté
- **Emplacement** : `apps/storefront/src/components/CartScreen.tsx:36` (commentaire « aucun ici — maquette ») ; aucune chaîne frais/minimum dans le dictionnaire.
- **Preuve** : spec §2.3 « frais et minimum affichés » ; absent des « Écarts » du rapport (seulement un commentaire de code).
- **Impact** : la livraison, argument commercial central, est montrée sans frais ni minimum ; écart silencieux (règle 14).
- **Correctif** : frais de livraison fictifs (entier en centimes, canal livraison seulement), minimum de commande avec message si le total est inférieur, inclus dans le total affiché — ou validation explicite de l'omission par le porteur, consignée.
- **Test** : unitaire `cart-calculations` (frais, minimum) + assertion e2e panier livraison.

### [MEDIUM] M3 — État localStorage non validé : démo cassée sans récupération
- **Emplacement** : `apps/storefront/src/state/cart-store.tsx:44`, `apps/backoffice/src/state/service-board-store.tsx:36` (`JSON.parse(raw) as Partial<…>` sans validation) ; `resetDemo` (`cart-store.tsx:178`) jamais utilisé.
- **Preuve** : `localStorage["demo-storefront-state-v1"] = {"lines":"oops"}` → `/fr/panier` et `/fr/menu` lèvent « t.reduce is not a function », page d'erreur Next par défaut, console : 2× « Refused to apply inline style… » (la page d'erreur par défaut viole la CSP). Le try/catch ne couvre que le parsing.
- **Impact** : évolution de schéma entre deux déploiements (clé `-v1`) ou état incohérent → démo cassée en rendez-vous, sans bouton de réinitialisation.
- **Correctif** : validation minimale (gardes de type ou Zod) ; si invalide → état initial + purge de la clé ; bouton visible « Réinitialiser la démo » (`resetDemo` + équivalent backoffice) ; le cas échéant `error.tsx`/`global-error.tsx` compatible nonce.
- **Test** : unitaire (`loadState` JSON de mauvaise forme → état initial) + e2e (stockage corrompu → page rendue, 0 erreur console).

### [MEDIUM] M4 — `formatMoney` suppose 2 décimales pour toutes les devises
- **Emplacement** : `packages/ui/src/format/money.ts:36` (`amountCents / 100`) ; toute devise ISO acceptée (l. 26).
- **Preuve** : `formatMoney(1250, "JPY", …)` → ≈ 13 JPY au lieu de 1 250 ; la doc dit « plus petite unité de la devise ».
- **Impact** : composant réutilisé aux L04/L05 (règle 2) ; latent en CHF, faux pour EUR/HUF/ISK… à l'extension UE.
- **Correctif** : décimales via `resolvedOptions().maximumFractionDigits` d'un `Intl.NumberFormat` de devise, ou type restreint `"CHF" | "EUR"`.
- **Test** : JPY (0 décimale) + BHD (3) ou devise refusée.

### [LOW] L1 — Garde-fou G4 contournable
- **Emplacement** : `.claude/hooks/guard-bash.sh:109-111`.
- **Preuve** : retournent 0 (non bloqués) : `gh api --method=DELETE …/rulesets/1` ; `gh api -XPUT …/rulesets/1` ; `gh api graphql -f query='mutation { deleteBranchProtectionRule(…) }'` ; `curl -X DELETE https://api.github.com/repos/…/rulesets/1`.
- **Impact** : l'audit-7 demandait le hook « idéalement » ; la règle 11 reste l'interdiction principale ; les outils GitHub MCP échappent de toute façon à un hook Bash.
- **Correctif** : `(-X|--method)[[:space:]=]*(PUT|PATCH|POST|DELETE)` collé ou avec `=` ; bloquer `gh api graphql` + `mutation` + `BranchProtectionRule|Ruleset` ; bloquer `api.github.com` + `rulesets|/protection` + méthode d'écriture ; documenter la limite MCP.
- **Test** : ces 4 cas en `bash_block` dans `test-guards.sh`.

### [LOW] L2 — Exception « documentation seule » (G2) : fichiers de gouvernance non exclus
- **Emplacement** : `CLAUDE.md` règle 11 ; `docs/process/workflow-lots.md:58-63`.
- **Preuve** : un commit post-audit sur `CLAUDE.md`, `.claude/**` ou `docs/process/**` peut passer pour « documentation ».
- **Impact** : assouplissement des conditions de fusion sans audit.
- **Correctif** : préciser que `CLAUDE.md`, `.claude/**`, `docs/process/**` et `.github/**` ne relèvent jamais de l'exception.

### [LOW] L3 — (hors périmètre, antérieur) Heredoc dans `$(…)` : échec ouvert de la règle `.env`
- **Emplacement** : `.claude/hooks/guard-bash.sh:49-84` (mode stripped).
- **Preuve** : `x=$(cat <<EOF⏎hello⏎EOF)⏎cat .env⏎echo EOF⏎EOF` → autorisé (0) par l'ancien comme par le nouveau hook ; bash ferme le heredoc à la parenthèse et exécute la ligne suivante (vérifié avec `cat /etc/hostname`).
- **Impact** : construction adverse délibérée ; pas une régression de N17.
- **Correctif** : conserver le corps quand le marqueur est dans une substitution `$(`, ou quand une ligne commence par le délimiteur suivi de `)`.
- **Test** : ce cas en `bash_block`.

### [LOW] L4 — Couverture e2e partielle et rapport qui surestime
- **Emplacement** : `e2e/tests/demo-viewport.spec.ts:9-18` (EN seulement sur l'accueil storefront) ; `e2e/tests/demo-accessibility.spec.ts:10-17` (FR, états vides) ; `e2e/tests/security-headers.spec.ts` (`/fr`, `/en` seulement) ; `implementation-report.md:67-69` et `:337-339`.
- **Preuve** : le rapport annonce une vérification e2e « aucune case cochée » inexistante et une CSP/X-Robots-Tag vérifiés « sur toutes les routes ajoutées » alors que seules `/fr` et `/en` le sont (curl confirme toutefois l'en-tête sur `/fr/panier`).
- **Correctif** : viewport et axe en 2 langues et en états remplis ; routes P01 dans `security-headers.spec.ts` ; `expect(checkbox).not.toBeChecked()` à l'ouverture ; corriger les formulations du rapport.

### [LOW] L5 — AC-P01-04 : pas de test du composant
- **Emplacement** : `packages/ui/src/components/OptionGroupField.tsx`.
- **Preuve** : seule la logique pure est testée ; l'état `disabled` au-delà de max n'est couvert par aucun test unitaire.
- **Correctif** : `renderToStaticMarkup` avec 2 choix sélectionnés et max=2 → 3e choix `disabled`.

### [LOW] L6 — Test creux
- **Emplacement** : `packages/ui/src/components/DemoBanner.test.ts:25`.
- **Preuve** : `expect(["text"]).toEqual(["text"])` n'est jamais faux ; ajouter `onClose` aux props ne le ferait pas échouer.
- **Correctif** : vraie vérification de type (`expectTypeOf<DemoBannerProps>().toEqualTypeOf<{ readonly text: string }>()`) ou suppression.

### [LOW] L7 — Netlify : noindex dépendant du runtime, hypothèses incomplètes
- **Emplacement** : `apps/storefront/netlify.toml`, `apps/backoffice/netlify.toml`, `docs/lots/P01-maquette/deploiement-netlify.md`.
- **Preuve** : X-Robots-Tag posé seulement par `next.config.ts`, aucun `[[headers]]` de repli pour les fichiers servis par le CDN ; `@netlify/plugin-nextjs` non épinglé ; prise en charge de pnpm 12.6.0 (`packageManager`, corepack) et de Node `>=24.21.0` par l'image de build absente des hypothèses ; les trois hypothèses listées sont bien marquées « non vérifiées ».
- **Correctif** : `[[headers]] for = "/*"` avec `X-Robots-Tag = "noindex, nofollow"` ; épingler le plugin ou dire qu'on s'appuie sur la détection automatique ; ajouter les hypothèses pnpm et Node.

### [LOW] L8 — Nom du restaurant fictif
- **Emplacement** : `apps/storefront/src/mock/restaurant.ts:3-9` ; `apps/storefront/src/i18n/dictionary.ts:78,82,142,146` ; `apps/backoffice/src/i18n/dictionary.ts:43,73`.
- **Preuve** : passage « Le Petit Lausannois » → « Le Belvédère Imaginaire » non consigné dans les écarts du rapport (la spec cite l'ancien nom) ; nom en dur à 6 endroits des dictionnaires, `restaurant.name` inutilisé. Vérification d'inexistence du nouveau nom non refaite par l'audit (pas d'accès web) : hypothèse du fil principal.
- **Correctif** : consigner l'écart ; tirer le nom de `restaurant.name` (donnée « tenant ») plutôt que du dictionnaire.

### [LOW] L9 — Thème : valeurs non validées, tailles en dur
- **Emplacement** : `packages/ui/src/tokens/to-css.ts:14,35` ; `packages/ui/src/themes/demo/stylesheet.ts:15,36-37,62,102,121`.
- **Preuve** : `tokensToCssVariables` exporté concatène les valeurs sans filtrage (`;`, `}`, `</style>`) ; sans risque aujourd'hui (thème statique) mais moteur prévu pour les thèmes tenant (ADR 0015), injecté via `dangerouslySetInnerHTML`. Tailles en dur (36, 96, 480, 20 px) contre « tokens uniquement ».
- **Correctif** : liste blanche par type de token (hex, longueur…) rejetant `;{}<>` ; tokens pour les tailles.
- **Test** : rejet de `red;}</style><script>`.

### [LOW] L10 — Parcours de démonstration incomplet ou permissif
- **Emplacement** : `CartScreen.tsx:55` ; `cart-store.tsx:157` ; `ServiceBoardScreen.tsx:164`.
- **Preuve** : « Payer » possible avec « dès que possible » décoché sans créneau ; `/paiement` accessible panier vide → commande à 0 CHF ; lignes supprimables mais quantité non modifiable (spec « lignes modifiables ») ; pas de variante explicite ; alerte d'arrivée seulement `aria-live` (`lastArrivalId` sans surbrillance) ; nom/téléphone invité persistés sans durée ni purge après paiement.
- **Correctif** : exiger `asap || slotId` et panier non vide sur `/paiement` ; +/− de quantité ; surbrillance de la dernière arrivée ; purger (ou ne pas persister) les données invitées après le « paiement ».

### [INFO]
- **I1** : `turbo run` → « Exec format error » même sur `@app/domain` (environnemental, reproduit) ; scripts racine `pnpm typecheck/test/build/test:e2e` non vérifiés via turbo ici → la fusion s'appuie sur le check `ci` vert sur la tête.
- **I2** : pendant la sonde, Chromium a tenté `www.google.com:443` (refusé par le proxy) — le navigateur lui-même, pas la page (`page.on("request")` : rien hors origine).
- **I3** : `80954d6` modifie un garde-fou de sécurité ; couvert ici ; `security-opus` non obligatoire (lot non critique), décision du fil principal.
- **I4** : implémentation attribuée par erreur au fil principal (voir note ci-dessous).
- **I5** : `47e7360` et `31e471a` sont des sauvegardes de travail en cours ; l'arbre final est vérifié.

## Verdict

**CHANGES_REQUIRED** — aucun BLOCKER ni HIGH ; les 11 AC sont satisfaits (41 e2e, lint, frontières, typecheck/test/build directs, hooks 127/127) ; le suivi audit-7 est fidèle et ne relâche rien. À corriger (ou, pour M2, justifier et faire accepter par le porteur) : M1, M2, M3, M4. LOW recommandés dans la même boucle : L1, L4, L7. Puis contre-audit (audit-2) et check `ci` vert sur la tête.

## Note du fil principal (Opus)

- **I4 rectifié** : l'implémentation a bien été faite par le sous-agent `developer-sonnet` (commits signés « Claude »). Le fil principal n'a commité que deux sauvegardes (`47e7360`, `31e471a`) lors d'interruptions, et la correction de CI `814edc6` (test monétaire dépendant de la version d'ICU : Node 24 en CI rend `1'234'567.89 CHF` en fr-CH, Node 22 `1 234 567.89 CHF`), postérieure au périmètre audité et à couvrir par l'audit-2.
- **CI** : `ci` et `docker-api` verts sur `814edc6` (turbo OK en CI) → I1 levé pour cette tête.
- **Revue `security-opus`** du garde-fou lancée en parallèle (`security-1.md`).
