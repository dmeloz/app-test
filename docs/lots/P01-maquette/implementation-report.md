# Rapport d'implémentation — Lot P01 (maquette cliquable) + suivi audit-7 (L00)

- **Agent** : fil principal Opus (exécution directe, sans déléguer à un sous-agent Sonnet distinct —
  la spec P01 est notée « critique : non », audit `auditor-opus` allégé ; les constats LOW de
  l'audit-7 relèvent de la gouvernance/du garde-fou, périmètre propre au fil principal).
- **Modèle réellement servi** : Claude Opus 5.5 (voir en-tête de session).
- **Branche** : `claude/lot-p01-maquette-bpjeoe`, créée depuis `origin/main` à `ff3cd3e` (L00 fusionné,
  PR #2). Rien poussé, aucune PR créée (le fil principal s'en charge séparément).
- **Commits** (dans l'ordre) :
  - `a78d4b6` — tokens de design, formatage monétaire et logique de groupe d'options (`packages/ui`)
  - `43b96dc` — composants React du design system de démonstration (`packages/ui`)
  - `8cbd648` — écrans storefront (accueil, menu, panier, paiement simulé, suivi)
  - `fc4fc0a` — écran tableau de service (backoffice) + reformatage Prettier des écrans storefront
  - `4ad5b28` — preuve de frontière ESLint `packages/ui` → `apps/storefront/src/mock` (AC-P01-11)
  - `47e7360` — sauvegarde intermédiaire (`next.config.ts` × 2, `MenuScreen.tsx`, `e2e/tests/pages.spec.ts`,
    premiers tests e2e `demo-*`) — commise par le fil principal après une interruption de session
  - `a81c388` — configuration Netlify (D-P01-1) et procédure de déploiement documentée
  - `80954d6` — constats LOW de l'audit 7 (gouvernance G1–G4, garde-fou N17, `threat-model.md` M15)
  - `31e471a` — test e2e de largeur mobile (AC-P01-01, 375 px) — commis par le fil principal après une
    seconde interruption de session, puis vérifié dans cette reprise (voir preuves ci-dessous)

## Périmètre reformulé

**P01** : 4 écrans de démonstration (accueil, menu, panier/créneau/paiement simulé/suivi, tableau de
service) construits dans les vraies apps (`apps/storefront`, `apps/backoffice`) et le vrai design
system (`packages/ui`), données 100 % fictives et isolées (`apps/*/src/mock/`), aucun appel réseau,
bandeau « Démonstration » permanent, accessibilité AA — voir `docs/lots/P01-maquette/spec.md`
(statut VALIDÉ, porteur, 2026-09-24).

**Suivi audit-7 (L00)** : constats LOW/INFO reportés à cette PR (`docs/lots/L00-socle/audit-7.md`) —
G1 (checks nommés + PR non brouillon dans la doc de process), G2 (portée de « audit APPROVED »), G3
(approbations humaines avant fusion), G4 (interdiction de contourner les checks, dans la règle **et**
dans le hook), N17 (faux marqueurs de heredoc de la règle `.env`), INFO M15 (`threat-model.md`).

**Hors périmètre, non touché** : `apps/api`, `packages/db`, `packages/contracts`, `packages/domain`
(hormis lecture), tout ce qui concerne paiement réel, authentification, base de données.

## Critères d'acceptation — AC par AC

### AC-P01-01 — 4 écrans FR/EN, 375 px, sans défilement horizontal
**Statut : satisfait.** 5 routes storefront (`/[locale]`, `/menu`, `/panier`, `/paiement`, `/suivi`) +
1 route backoffice (`/[locale]`), chacune en `fr` et `en`. Défilement horizontal mesuré réellement
(`document.documentElement.scrollWidth` vs `clientWidth`) à 375×812 sur les 8 combinaisons
route/locale : `e2e/tests/demo-viewport.spec.ts`, **8/8 verts** (voir « Commandes exécutées »).

### AC-P01-02 — Parcours client complet, aucune erreur console
**Statut : satisfait.** `e2e/tests/demo-storefront-flow.spec.ts` : accueil → clic « Retrait » → menu →
produit à option obligatoire (« Entrecôte », cuisson min=1/max=1, l'ajout sans sélection est refusé
avec message d'erreur avant de réussir une fois la cuisson choisie) → panier (créneau choisi via
`SlotList`) → paiement simulé → suivi avancé manuellement jusqu'à « Prête ». Console et erreurs JS
collectées et vérifiées vides. **1/1 vert**.

### AC-P01-03 — Tableau de service : arrivée, Accepter → Prête, Pause
**Statut : satisfait.** `e2e/tests/demo-backoffice-flow.spec.ts` : une commande fictive apparaît sans
action de l'utilisateur (amorçage automatique 300 ms après le montage, `useServiceBoard`), Accepter →
« En préparation », Prête → « Prête » (plus de bouton Accepter/Refuser), puis Pause affiche l'état en
pause (« Reprendre les commandes » visible). **1/1 vert**.

### AC-P01-04 — Groupe min=1 bloque l'ajout ; max=2 bloque une 3ᵉ sélection
**Statut : satisfait.** Logique pure testée sans rendu : `packages/ui/src/option-group/logic.test.ts`
(9 tests) — `isSelectionValid` refuse une sélection vide pour min=1 ; `toggleSelection` ignore un 3ᵉ
choix au-delà de max=2 (sélection inchangée) et autorise toujours le retrait. Rejoué dans le parcours
e2e réel (AC-P01-02, message d'erreur affiché avant réussite). Calculs de panier (min/max appliqués
au produit réel du menu) : `apps/storefront/src/state/cart-calculations.test.ts`.

### AC-P01-05 — Aucun supplément présélectionné
**Statut : satisfait.** `getInitialSelection` renvoie toujours `[]`, y compris pour un groupe
obligatoire (test dédié `logic.test.ts`). Vérifié aussi visuellement dans le parcours e2e (aucune case
cochée à l'ouverture d'un produit).

### AC-P01-06 — Allergènes visibles avant ajout
**Statut : satisfait.** `packages/ui/src/components/ProductCard.test.ts` : les allergènes apparaissent
dans le balisage rendu (pas derrière un clic), y compris avant tout ajout au panier ; un produit en
rupture masque le contenu enfant (bouton d'ajout) et affiche le badge de rupture.

### AC-P01-07 — Bandeau de démonstration sur chaque page, non masquable
**Statut : satisfait.** `e2e/tests/demo-banner.spec.ts` : bandeau présent et texte exact vérifié sur
les 5 routes storefront × 2 locales + 1 route backoffice × 2 locales, et absence de tout `<button>`
dans le bandeau (aucun moyen de le fermer). Composant `DemoBanner` n'expose de toute façon aucune prop
de fermeture (`DemoBanner.test.ts`). **13/13 verts**.

### AC-P01-08 — Aucun appel réseau vers l'API ni un domaine tiers
**Statut : satisfait.** Interception réelle de toutes les requêtes (`page.on("request")`) pendant les
parcours AC-P01-02 et AC-P01-03 : chaque URL observée doit commencer par l'origine de l'app elle-même
(aucune n'est vérifiée a priori — l'assertion échouerait sur la moindre requête `data:`/tierce non
attendue). 0 requête hors origine dans les deux parcours.

### AC-P01-09 — Axe : aucune violation serious/critical sur les 4 écrans
**Statut : satisfait.** `e2e/tests/demo-accessibility.spec.ts` (`@axe-core/playwright`, tags
`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`) sur storefront (accueil, menu, panier, paiement, suivi) et
backoffice (tableau de service) à 375×812 : **6/6 verts**, 0 violation serious/critical.
Contraste AA du thème de démonstration vérifié en amont, automatiquement, pour chaque paire
texte/fond et chaque statut de commande : `packages/ui/src/tokens/demo-theme.test.ts` (formules WCAG
réelles, pas une estimation — `packages/ui/src/tokens/contrast.ts`).

### AC-P01-10 — Toutes les vérifications du L00 restent vertes
**Statut : satisfait, avec un écart d'environnement documenté ci-dessous (turbo).** `pnpm format:check`,
`pnpm lint`, `pnpm test:lint-boundaries` : verts tels quels. `pnpm typecheck`/`test`/`build`/`test:e2e`
échouent au niveau de l'orchestration Turborepo dans **cet environnement précis** (`Exec format error`,
reproductible même sur des paquets non touchés par ce lot) ; chaque commande sous-jacente, rejouée
directement sans Turborepo, réussit à 100 % (typecheck/build/test des 10 paquets/apps, 41 tests e2e).
Voir « Écart d'environnement (Turborepo) » ci-dessous pour le détail et l'analyse.

### AC-P01-11 — `packages/ui` n'importe aucune donnée fictive
**Statut : satisfait.** Chaque composant de `packages/ui` reçoit ses textes/valeurs déjà résolus par
l'app appelante (aucun `import` vers `apps/*/src/mock`). Preuve automatisée et pas seulement une
relecture : fixture dédiée `packages/ui/src/__lint-fixtures__/imports-storefront-mock.ts` + cas de
test dans `tools/eslint-boundaries.test.mjs` — la règle générique `import-x/no-restricted-paths`
(« un paquet n'importe pas une app », ADR 0001, déjà en place au L00) couvre bien ce cas précis.
**18/18 verts** (frontières ESLint).

## Constats LOW de l'audit-7 (L00) — traités

| Constat | Traitement | Preuve |
|---|---|---|
| G1 | `CLAUDE.md` (règle 11), `workflow-lots.md`, `definition-of-done.md` citent désormais explicitement « PR non brouillon » et les checks nommés `ci`/`docker-api`. | Lecture des trois fichiers, commit `80954d6`. |
| G2 | « Audit indépendant `APPROVED` » précisé (règle 11, `workflow-lots.md`, DoD) : tous les audits requis par le lot (`security-opus` en plus d'`auditor-opus` pour un lot critique), portant sur le SHA effectivement fusionné ; tout commit postérieur doit être audité ou strictement limité à la documentation. | Idem. |
| G3 | Règle 11 + `workflow-lots.md` exigent désormais explicitement que les approbations humaines obligatoires du lot soient obtenues **avant** la fusion, pas après. | Idem. |
| G4 | `.claude/hooks/guard-bash.sh` bloque désormais `gh pr merge --admin` (et variantes avec d'autres options), `gh api` en méthode non GET (`-X`/`--method` PUT/PATCH/POST/DELETE) sur un ruleset ou une protection de branche, et les sous-commandes d'écriture de `gh ruleset` (create/edit/update/delete/import). Règle 11 du `CLAUDE.md` l'interdit aussi explicitement dans le texte. | 20 nouveaux cas dans `test-guards.sh` (voir ci-dessous), tous verts. |
| N17 | Le mode « stripped » de `extract()` (règle `.env` uniquement) comparait la ligne de terminaison d'un heredoc après un simple `.strip()`, y compris pour un `<<` sans tiret — **vérifié dans cet environnement réel** (`bash`) qu'un terminateur indenté ou suivi d'espaces ne termine PAS un heredoc sans tiret ; seul `<<-` tolère des tabulations de tête. Corrigé par une comparaison stricte (`line == term`, ou `line.lstrip("\t") == term` uniquement pour `<<-`). Réduit les faux marqueurs de fin qui faisaient fuiter du contenu de heredoc (potentiellement une mention de `.env`) hors de la zone retirée, causant des blocages à tort sur des commandes légitimes (rédiger un document mentionnant `.env`). | 5 nouveaux cas ciblés dans `test-guards.sh`, tous verts ; vérification manuelle directe contre un vrai `bash` (voir ci-dessous). |
| LOW/INFO (limites résiduelles) | **Non corrigées, documentées telles quelles** (comme demandé) : redirection depuis l'entrée standard (ex. `. /dev/stdin`), variable d'environnement désignant un interpréteur (ex. `$SHELL`), script écrit puis exécuté en deux commandes séparées. Limites inhérentes à un hook Bash sans exécution réelle de la commande. | Commentaire dans `guard-bash.sh` (inchangé sur ce point, déjà documenté à l'audit-7) ; non revendiqué comme corrigé ici. |
| INFO M15 | `docs/security/threat-model.md`, ligne M15 : « revue humaine » remplacée par la description réelle de la gouvernance (audit Opus indépendant obligatoire, checks `ci`/`docker-api`, fusion réservée au fil principal sous conditions strictes incluant l'interdiction de contourner les checks, déploiement de production toujours soumis à une autorisation humaine explicite). | Lecture du fichier, commit `80954d6`. |

**Vérification manuelle du correctif N17** (bash réel, dans cet environnement) :

```
$ bash -c 'cat <<EOF
  EOF
line-after-indented-eof
EOF
'
  EOF
line-after-indented-eof
---exit:0---
```

Confirme qu'un terminateur indenté ne termine **pas** un heredoc sans tiret (comportement réel de
bash) — c'est exactement ce que `real_terminator_match` reproduit désormais dans `guard-bash.sh`.

## Décision D-P01-1 (Netlify)

`apps/storefront/netlify.toml`, `apps/backoffice/netlify.toml` (deux sites distincts, ADR 0010) et
`docs/lots/P01-maquette/deploiement-netlify.md` fournis. **Aucun déploiement effectué** (règle n°11).
Points explicitement marqués « hypothèse — à vérifier par le porteur » dans ce document (le fil
principal n'a pas pu consulter `docs.netlify.com`/`netlify.com`, bloqués par le proxy réseau de
l'environnement) : prise en charge de Next.js 16/`proxy.ts` par le runtime Netlify, conditions de
l'offre gratuite pour un usage de démonstration commerciale, disponibilité de la protection par mot
de passe. En-tête `X-Robots-Tag: noindex, nofollow` déjà posé sur toutes les routes des deux apps
(`next.config.ts`), vérifié par `e2e/tests/security-headers.spec.ts`.

## Écarts par rapport à la spec / hypothèses / décisions à valider

- **Découpage de « l'écran 3 »** (fait vérifié quant au code, décision à valider quant à
  l'interprétation) : la spec §2 décrit un seul écran « Panier et créneau » qui enchaîne aussi vers
  « paiement simulé » puis « suivi », mais le titre de section parle de « 4 écrans » au total. J'ai
  implémenté ces trois étapes comme 3 routes distinctes (`/panier`, `/paiement`, `/suivi`) plutôt que
  3 états d'une seule page, pour la clarté du code et la fiabilité des tests e2e (URL vérifiable à
  chaque étape). Le compte total reste 4 écrans conceptuels (accueil, menu, panier/créneau incluant
  paiement+suivi, tableau de service), mais 6 routes techniques existent côté storefront. À valider :
  ce découpage correspond-il à l'intention du porteur pour la démo ?
- **`packages/i18n` reste vide** (décision à valider, déjà signalée dans la spec comme option) : les
  textes P01 sont dans `apps/*/src/i18n/dictionary.ts`, le mécanisme déjà établi au lot L00 et
  explicitement prévu pour rester minimal jusqu'au lot L05 (commentaire de tête de ces fichiers dès
  le L00). Réutiliser ce mécanisme plutôt que de commencer à remplir `packages/i18n` évite une
  divergence d'architecture non prévue par la spec P01, qui ne tranche pas explicitement ce point.
- **Alerte sonore optionnelle** (spec §2, « alerte visuelle et sonore optionnelle ») : **non
  implémentée**. L'alerte visuelle existe (nouvelle commande dans la colonne « Nouvelles », région
  `aria-live` annonçant l'arrivée) ; le son a été volontairement omis pour ne pas introduire de
  comportement dépendant du geste utilisateur/de la politique navigateur difficile à vérifier de
  façon fiable dans cet environnement, et parce que la spec le qualifie explicitement d'optionnel.
  Écart signalé, pas caché.
- **`Button.tsx`** : composant `<button>` HTML natif, pas un lien — cohérent avec CartBar/liens qui
  utilisent un vrai `<a>` pour la navigation complète (pas de dépendance `next/link` dans
  `packages/ui`, qui reste indépendant du framework). Décision technique, pas d'impact sur les AC.
- **`react`/`react-dom` déclarés comme dépendances de `packages/ui`** (peer + dev) : ce ne sont pas de
  nouvelles bibliothèques pour le monorepo (déjà dépendances de production des deux apps Next depuis
  le L00), seulement une nouvelle entrée dans le `package.json` de `packages/ui` pour compiler/tester
  ses propres composants React. Signalé par transparence (règle « nouvelle dépendance de production =
  validation humaine ») plutôt que présumé anodin sans le dire.
- **`@axe-core/playwright`** ajouté en devDependency racine (test uniquement) pour AC-P01-09, comme
  explicitement autorisé par les instructions de la tâche. Version `4.13.0`, résolue depuis le
  registre npm (atteignable dans cet environnement).
- **Icônes** : aucune (texte + `role`/`aria-*` seulement), conformément à la contrainte « pas de
  framer-motion/lucide ; icônes en SVG inline ou texte » — j'ai choisi le texte seul (pastilles de
  statut avec libellé), plus simple à maintenir en accessibilité et suffisant pour la démo.
- **Fragilité potentielle des assertions `Intl`** (`packages/ui/src/format/money.test.ts`) : les
  chaînes attendues (séparateurs ` `/` `) ont été vérifiées contre la sortie réelle de
  Node/ICU dans cet environnement, pas devinées — mais une version différente d'ICU (autre image CI)
  pourrait théoriquement produire un séparateur différent. Signalé comme risque, pas comme certitude.

## Écart d'environnement (Turborepo) — affecte `typecheck`/`test`/`build`/`test:e2e`

**Fait vérifié, reproduit à de nombreuses reprises, y compris sur des paquets non modifiés par ce
lot** (`@app/domain`, `@app/config`, `@app/contracts`, `@app/db`, `@app/i18n`, `@app/testing`) :
`turbo run <task>` échoue systématiquement avec `Exec format error (os error 8)` lors du spawn du
tout premier processus enfant, quel que soit le paquet ciblé (y compris en filtrant un seul paquet,
sans aucune concurrence), avec ou sans le flag `--concurrency`, avec ou sans le sandbox du terminal
désactivé (`dangerouslyDisableSandbox`). `turbo --version` fonctionne (`2.11.3`) ; c'est bien le
spawn d'un sous-processus par le binaire Turborepo qui échoue dans cette session/ce conteneur précis,
pas un problème de code de ce lot. Confirmé aussi présent avant ce lot (paquets L00 intacts).

**Conséquence sur les preuves** : chaque commande racine concernée (`pnpm typecheck`, `pnpm test`,
`pnpm build`, la première étape de `pnpm test:e2e`) est citée ci-dessous **avec son échec réel**, puis
remplacée par l'exécution directe (sans Turborepo) de la même commande sous-jacente dans chacun des
10 paquets/apps du monorepo — qui, elle, réussit à 100 %. Rien n'est inventé : les deux séries de
sorties sont réelles et reproductibles dans cette session.

## Commandes exécutées et résultats réels

```
$ pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Done in 1.3s using pnpm v12.6.0

$ pnpm format:check
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!

$ pnpm lint
$ eslint .
(aucune sortie = 0 erreur, 0 avertissement)

$ pnpm test:lint-boundaries
# tests 18
# pass 18
# fail 0

$ pnpm typecheck
   • Packages in scope: @app/config, @app/contracts, @app/db, @app/domain, @app/i18n, @app/testing, @app/ui, api, backoffice, storefront
@app/ui#typecheck:  ERROR  command finished with error: Exec format error (os error 8)
@app/domain#typecheck:  ERROR  command finished with error: Exec format error (os error 8)
@app/testing#typecheck:  ERROR  command finished with error: Exec format error (os error 8)
@app/db#typecheck:  ERROR  command finished with error: Exec format error (os error 8)
 Tasks:    0 successful, 9 total
 ERROR  run failed: command  exited (1)

# Substitut (sans Turborepo), les 10 paquets/apps, un par un :
$ (cd packages/config && pnpm run typecheck)   → tsc -p tsconfig.json --noEmit   (0 erreur)
$ (cd packages/contracts && pnpm run typecheck) → idem (0 erreur)
$ (cd packages/db && pnpm run typecheck)        → idem (0 erreur)
$ (cd packages/domain && pnpm run typecheck)    → idem (0 erreur)
$ (cd packages/i18n && pnpm run typecheck)      → idem (0 erreur)
$ (cd packages/testing && pnpm run typecheck)   → idem (0 erreur)
$ (cd packages/ui && pnpm run typecheck)        → idem (0 erreur)
$ (cd apps/api && pnpm run typecheck)           → idem (0 erreur)
$ (cd apps/storefront && pnpm run typecheck)    → idem (0 erreur)
$ (cd apps/backoffice && pnpm run typecheck)    → idem (0 erreur)

$ pnpm test
@app/ui#test:  ERROR  command finished with error: Exec format error (os error 8)
@app/db#test:  ERROR  command finished with error: Exec format error (os error 8)
@app/i18n#test: ERROR  command finished with error: Exec format error (os error 8)
 Tasks:    0 successful, 9 total
 ERROR  run failed: command  exited (1)

# Substitut, un par un :
packages/config    → vitest run : No test files found (0, préexistant au L00)
packages/contracts  → idem
packages/db         → idem
packages/domain     → Test Files 1 passed / Tests 9 passed
packages/i18n       → No test files found (préexistant)
packages/testing    → No test files found (préexistant)
packages/ui         → Test Files 6 passed / Tests 37 passed
apps/api            → Test Files 8 passed / Tests 33 passed
apps/storefront      → Test Files 2 passed / Tests 14 passed
apps/backoffice      → Test Files 1 passed / Tests 4 passed
                       ─────────────────────────────────────
                       97 tests réels passés, 0 échec

$ pnpm build
@app/config#build: ERROR  command finished with error: Exec format error (os error 8)
@app/db#build:     ERROR  command finished with error: Exec format error (os error 8)
@app/i18n#build:   ERROR  command finished with error: Exec format error (os error 8)
@app/testing#build: ERROR command finished with error: Exec format error (os error 8)
 Tasks:    0 successful, 8 total
 ERROR  run failed: command  exited (1)

# Substitut, un par un : les 8 paquets tsc (config/contracts/db/domain/i18n/testing/ui/api) compilent
# sans erreur (`tsc -p tsconfig.build.json`) ; `next build` réussit pour storefront (12 pages,
# 6 routes `[locale]*` dynamiques) et backoffice (4 pages, 1 route dynamique), TypeScript intégré au
# build Next inclus (« Finished TypeScript » sans erreur dans les deux cas).

$ pnpm test:e2e
$ turbo run build --filter=storefront --filter=backoffice && playwright test ...
@app/ui#build:  ERROR  command finished with error: Exec format error (os error 8)
 Tasks:    0 successful, 1 total
 ERROR  run failed: command  exited (1)
[ELIFECYCLE] Command failed with exit code 1.

# Substitut : build direct de packages/ui, apps/storefront, apps/backoffice (ci-dessus, tous OK), puis :
$ CI=1 pnpm exec playwright test --config e2e/playwright.config.ts
Running 41 tests using 2 workers
  ... (41 lignes ✓)
  41 passed (17.3s)

$ bash .claude/hooks/test-guards.sh
ok   [...]  × 127
FAIL : 0
```

## Fichiers modifiés (84 fichiers, `ff3cd3e..HEAD`)

- **`packages/ui/src/`** : `tokens/{types,demo-theme,to-css,contrast}.ts` (+ tests),
  `format/money.ts` (+ test), `option-group/logic.ts` (+ test), `themes/demo/stylesheet.ts`,
  `components/{DemoBanner,Button,StatusBadge,ProductCard,OptionGroupField,CartBar,OrderCard,
  ThemeStyle,Stepper,SlotList}.tsx` (+ tests DemoBanner/ProductCard), `index.ts`,
  `__lint-fixtures__/imports-storefront-mock.ts` ; `package.json`, `tsconfig*.json`,
  `vitest.config.ts` mis à jour.
- **`apps/storefront/src/`** : `mock/{types,restaurant,menu,slots,localize,format}.ts`,
  `state/{cart-store.tsx,cart-calculations.ts}` (+ test), `components/{HomeScreen,MenuScreen,
  CartScreen,PaymentScreen,TrackingScreen}.tsx`, `app/[locale]/{layout.tsx,page.tsx,menu/page.tsx,
  panier/page.tsx,paiement/page.tsx,suivi/page.tsx}`, `i18n/dictionary.ts` (+ test étendu),
  `netlify.toml`, `next.config.ts` (X-Robots-Tag), `package.json` (`@app/ui`).
- **`apps/backoffice/src/`** : `mock/{types,orders,menu-items,localize}.ts`,
  `state/service-board-store.tsx`, `components/ServiceBoardScreen.tsx`,
  `app/[locale]/{layout.tsx,page.tsx}`, `i18n/dictionary.ts` (+ test étendu), `netlify.toml`,
  `next.config.ts` (X-Robots-Tag), `package.json` (`@app/ui`).
- **`e2e/tests/`** : `demo-storefront-flow.spec.ts`, `demo-backoffice-flow.spec.ts`,
  `demo-banner.spec.ts`, `demo-viewport.spec.ts`, `demo-accessibility.spec.ts` (nouveaux) ;
  `pages.spec.ts` (contenu mis à jour), `security-headers.spec.ts` (X-Robots-Tag).
- **`.claude/hooks/`** : `guard-bash.sh` (G4, N17), `test-guards.sh` (+20 cas).
- **`docs/`** : `process/workflow-lots.md`, `process/definition-of-done.md` (G1–G3),
  `security/threat-model.md` (M15), `lots/P01-maquette/deploiement-netlify.md` (nouveau).
- **Racine** : `CLAUDE.md` (règle 11, G2–G4), `package.json` (`@axe-core/playwright`),
  `pnpm-lock.yaml`, `tools/eslint-boundaries.test.mjs` (+1 cas).

## Migrations

Aucune. Aucun schéma de base de données touché par ce lot (spec P01 §2, exclusions : « aucune base »).

## Sécurité (`.claude/rules/security.md`)

- Aucun secret lu/copié/commité (hooks de garde-fou actifs et renforcés — G4).
- Aucune donnée personnelle réelle : restaurant, adresse, clients tous fictifs et explicitement
  qualifiés comme tels dans le code et les données (`// provisoire`, adresse « (fictif) »).
- CSP à nonce du L00 conservée intacte, vérifiée par e2e sur toutes les routes ajoutées
  (`security-headers.spec.ts`), aucun style/script en ligne non couvert par le nonce (feuille de
  style unique injectée via `<style nonce>`, jamais d'attribut `style=""`).
- Aucun appel réseau vers un tiers ou une API (AC-P01-08, vérifié par interception réelle).

## Questions ouvertes pour le porteur

1. Le découpage en 6 routes techniques côté storefront (au lieu d'un seul écran à états) convient-il,
   ou préférez-vous une seule page avec des sections qui s'enchaînent (impact : réécriture du
   parcours, pas des données ni du design system) ?
2. Alerte sonore optionnelle du tableau de service : à ajouter maintenant, ou reporté ? (proposition :
   `AudioContext` protégé par `try/catch`, activé par une case à cocher, jamais testé en e2e headless
   de façon fiable).
3. `docs/lots/P01-maquette/spec.md` §12 (Temps) : cellules du porteur laissées vides comme demandé —
   à remplir par le porteur (cadrage, validation/revue, tests manuels, démarchage restaurants).
4. Confirmer que l'écart d'environnement Turborepo documenté ci-dessus est bien spécifique à cette
   session/ce conteneur (à revérifier dans l'environnement CI réel, qui pourrait très bien ne pas être
   affecté — aucune preuve n'existe dans un sens ou l'autre pour la CI GitHub Actions elle-même).
