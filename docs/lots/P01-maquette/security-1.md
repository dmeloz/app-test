# Audit sécurité 1 — Lot P01 (maquette) + suivi L00 (G4, N17) — 2026-09-27

- **Auditeur** : security-opus (revue orientée OWASP ASVS / OWASP API Security Top 10 2023, adaptée au
  périmètre : aucune API, aucune donnée réelle dans ce diff).
- **Périmètre audité** : branche `claude/lot-p01-maquette-bpjeoe`, diff `ff3cd3e..fdc3794`.
  - Périmètre 1 (prioritaire) : commit `80954d6` — `.claude/hooks/guard-bash.sh`, `.claude/hooks/test-guards.sh`.
  - Périmètre 2 : maquette P01 (CSP à nonce, appels réseau, `localStorage`, `X-Robots-Tag`).
  - Hors périmètre : `814edc6` (commit postérieur apparu pendant l'audit, test `money.test.ts` seul,
    lu : sans effet sécurité ; au titre de G2 il doit être couvert par l'audit `auditor-opus`).
- **Méthode** : aucune attaque contre un service réel, aucun appel externe, aucune donnée réelle. Les
  commandes « dangereuses » ont été passées **comme données** au hook (JSON sur l'entrée standard,
  comme le fait `test-guards.sh`), jamais exécutées. Les comportements bash ont été vérifiés avec des
  scripts inoffensifs (`echo LEAKED`) dans le répertoire temporaire de session. Serveurs Next lancés en
  local (`next start`, 127.0.0.1:3100/3101) et Chromium local préinstallé.
- **Rappel** : cette revue est faite par un agent, pas par un pentester humain. **Un test d'intrusion
  externe reste requis avant toute commercialisation.**

## Vérifications rejouées (sorties réelles)

| Commande | Résultat réel |
|---|---|
| `bash .claude/hooks/test-guards.sh` (HEAD) | exit 0 — **127 « ok », 0 FAIL** |
| anciens tests (`ff3cd3e`) contre l'ancien hook | 107 ok, 0 FAIL (référence) |
| anciens tests (`ff3cd3e`) contre le **nouveau** hook | **107 ok, 0 FAIL → aucune régression** |
| nouveaux tests contre l'ancien hook | 115 ok, 12 FAIL (les 12 cas G4/N17 nouveaux : le correctif est bien ce qui les fait passer) |
| `guard-files.sh` `ff3cd3e` vs HEAD | identique |
| Échec fermé : entrée non JSON, JSON tronqué, commande > 64 Ko | 2, 2, 2 (inchangé) |
| Différentiel N17 : 156 combinaisons heredoc (`<<`/`<<-` × délimiteur nu/'…'/"…" × 13 terminateurs × avec/sans `$(…)`), exécutées dans bash 5.2.21 puis passées au mode « stripped » ancien et nouveau | lignes exécutées par bash mais masquées au contrôle : **ancien 8, nouveau 8 (mêmes cas)** ; 72 cas où l'ancien exposait des lignes que bash n'exécute pas (faux positifs corrigés) |
| Build `@app/ui`, `storefront`, `backoffice` (`pnpm --filter … build`) | OK, toutes les routes `ƒ` (dynamiques) + `Proxy (Middleware)` |
| `vitest run` (ui / storefront / backoffice, lancé par paquet : `turbo` échoue ici en `Exec format error`, écart d'environnement déjà documenté dans le rapport d'implémentation) | 37 / 14 / 4 tests verts |
| Playwright : `security-headers`, `demo-storefront-flow`, `demo-backoffice-flow`, `demo-banner`, `demo-viewport` | **27 passed** |
| `curl -D -` sur `/fr/menu`, backoffice `/en`, `/fr/inexistant` (404) et un chunk `/_next/static/…js` | CSP à nonce présente sur les pages et la 404 ; `X-Robots-Tag: noindex, nofollow` sur les 4 réponses, y compris l'asset statique |
| Analyse du HTML rendu (7 routes, 2 apps) | tous les `<script>` inline et l'unique `<style>` portent le nonce de la requête ; 0 attribut `style=""` ; 0 gestionnaire `on*=` ; 0 URL externe |

## Suivi des constats demandés

| Constat | Statut | Preuve |
|---|---|---|
| N17 (audit-7) | **RÉSOLU, sans réduction de la protection `.env`** | Différentiel ci-dessus : le nouveau terminateur strict (`guard-bash.sh:66-69`) suit exactement bash (espace de tête/fin, tabulation sur `<<`, `\r` final : bash reste dans le corps, vérifié). Aucun cas où le nouveau hook masque une ligne que l'ancien exposait et que bash exécute. Il est aussi vérifié que le Bash de Claude Code est bien bash (`bash -c … eval '<commande>'` visible dans la liste des processus). |
| G4 (audit-7) | **PARTIEL** | Les formes testées par le commit sont bloquées ; les variantes courantes ne le sont pas et le canal de fusion réellement disponible (MCP GitHub) n'est pas couvert : constat S1. |

## Constats

### [MEDIUM] S1 — G4 : garde-fou contournable par des variantes courantes, canal MCP GitHub non couvert
- **Emplacement** : `.claude/hooks/guard-bash.sh:109-111` ; `.claude/settings.json:34-49` (matchers lignes 37 et 43 :
  `Bash` et `Read|Edit|Write|MultiEdit` uniquement).
- **Preuve (exécutée, commande passée comme donnée au hook ; « new » = HEAD, « old » = `ff3cd3e`)** :
  - bloquées (2) : `gh pr merge 12` avec l'option admin placée avant ou après, `=true`, préfixe
    `GH_REPO=…` ; `-X` + méthode sur `…/rulesets/1` ou `…/branches/main/protection/required_status_checks`.
  - **non bloquées (0)** :
    - `gh api --method=PUT repos/acme/app/rulesets/1 --input r.json` (forme `=` : la regex exige un espace) ;
    - `gh api -XDELETE repos/acme/app/rulesets/1` (option collée) ;
    - `gh api repos/acme/app/rulesets` avec `-f name=x` / `--input` sans `-X` (d'après la documentation
      de `gh api`, la méthode devient POST dès qu'un paramètre est fourni — **hypothèse**, `gh` n'est pas
      installé dans cet environnement) ;
    - chemin découpé par le shell : `"repos/acme/app/rule""sets/1"` ou `rule''sets` ;
    - `gh pr --repo acme/app merge 12` et `gh -R acme/app pr merge 12` avec l'option admin (option
      persistante avant la sous-commande — **hypothèse** sur l'analyse d'options de `gh`) ;
    - alias : `gh alias set m 'pr merge …admin'` puis `gh m 12` ;
    - GraphQL : `gh api graphql` avec les mutations `deleteRepositoryRuleset`,
      `deleteBranchProtectionRule`, `mergePullRequest` ;
    - fusion REST directe `PUT repos/{o}/{r}/pulls/{n}/merge` via `gh api` (côté serveur, équivalent
      d'une fusion administrative si l'identité a un droit de contournement) ;
    - `curl` vers `api.github.com` avec le jeton de `gh auth token`.
  - **Fait vérifié** : `gh` n'est pas installé ici (`which gh` vide) ; le processus Claude Code est
    lancé avec `mcp__github__*` dans les outils autorisés ; aucun hook `PreToolUse` ne porte sur les
    outils MCP. Le canal de fusion effectivement disponible au fil principal est donc l'outil MCP de
    fusion de PR, que `guard-bash.sh` ne voit jamais.
  - Remarque : `gh ruleset` n'a, d'après sa documentation, que `list`, `view`, `check` ; la règle
    `:111` est donc sans objet (inoffensive).
- **Impact** : la règle 11 / G4 (« jamais de fusion administrative ou équivalent, jamais de
  modification du ruleset ») n'est pas réellement appliquée par le hook, alors que le message du
  commit `80954d6` l'affirme. Si l'identité GitHub utilisée par l'agent est administratrice ou
  « bypass actor » du ruleset, une fusion via MCP ou REST passe outre les checks `ci`/`docker-api`
  sans aucun signal. Pas de régression (l'ancien hook ne bloquait rien de tout cela), d'où MEDIUM.
- **Correctif attendu** :
  1. Barrière réelle côté serveur (action du porteur, non vérifiable ici) : ruleset sur `main` sans
     acteur de contournement pour l'identité de l'agent (ou « Do not allow bypassing »), jeton de
     l'agent sans droit admin sur le dépôt. Documenter la vérification.
  2. Hook : pour `gh api`, normaliser d'abord (retirer les guillemets, accepter `=` et l'option
     collée), bloquer toute méthode non GET **y compris implicite** (présence de `-f`/`-F`/`--field`/
     `--raw-field`/`--input`) dès que le chemin vise `rulesets`, `protection`, `pulls/…/merge` ;
     bloquer `gh api graphql` contenant une mutation `*Ruleset*`, `*BranchProtection*`,
     `mergePullRequest` ; bloquer l'option admin de `pr merge` quelle que soit la position de
     `pr`/`merge` ; bloquer `gh alias set` contenant `merge` ; bloquer `curl`/`wget` vers
     `api.github.com` en méthode non GET.
  3. Ajouter un hook `PreToolUse` (ou une règle `ask`) sur l'outil MCP de fusion de PR et sur tout
     outil MCP d'écriture de protection, ou documenter explicitement que G4 repose sur (1) pour ce canal.
- **Test de vérification** : ajouter à `test-guards.sh` les variantes ci-dessus (attendu 2) et
  conserver les cas GET attendus à 0 ; vérification manuelle du ruleset par le porteur.

### [LOW] S2 — Faux positif « push forcé » : la regex déborde sur toute la commande (préexistant)
- **Emplacement** : `.claude/hooks/guard-bash.sh:98` (et `:99-100`, même construction), inchangées depuis `ff3cd3e`.
- **Preuve (exécutée, new = old = 2)** : `git push origin claude/lot-p01 && readlink` suivi de l'option
  `-f` puis d'un chemin (cas du fil principal) ; `git push -u origin <branche>; ls` suivi de `-f` ;
  `git push` puis, ligne suivante, `grep` avec `-f` ; `git push` suivi d'une expression arithmétique
  contenant un signe plus collé à un chiffre ; `git push origin feat && git log --oneline` suivi du
  nom de la branche principale. Cause : `.*` traverse `&&`, `;`, `|` et les retours à la ligne, donc
  toute option `-f`, tout signe plus collé à un mot ou toute mention de la branche principale placée
  **n'importe où après** `git … push` est attribuée au push.
- **Impact** : blocage à tort (échec fermé, pas de contournement). Confirme l'observation du fil
  principal : préexistant, non introduit par ce diff. (Ce rapport a d'ailleurs dû être reformulé pour
  passer le hook.)
- **Correctif attendu** : restreindre la recherche au segment de la commande `git push` (par exemple
  remplacer `.*` par `[^;&|\n]*` après `push`), avec cas de non-régression : les 107 cas actuels, les
  faux positifs ci-dessus attendus à 0, et toujours attendus à 2 : push avec `-f` en fin de commande,
  push d'une référence préfixée d'un signe plus, push forcé placé après un `;`.
- **Test de vérification** : `bash .claude/hooks/test-guards.sh` étendu.

### [LOW] S3 — Règle `.env` : masquages résiduels du mode « stripped » (préexistants, non aggravés par N17)
- **Emplacement** : `.claude/hooks/guard-bash.sh:49-85`.
- **Preuve (exécutée dans bash 5.2.21 avec `echo LEAKED`, puis au hook avec `cat .env` ; new = old = 0)** :
  1. heredoc dans une substitution `x=$(cat <<EOF` … `EOF)` : bash ferme le heredoc à la fin de la
     substitution (avertissement « delimited by end-of-file ») et **exécute la ligne suivante** ; le
     hook, ne voyant jamais `EOF` seul, masque tout le reste ;
  2. délimiteur non quoté coupé par une continuation `EO\` puis `F` : bash recolle la ligne et termine
     le heredoc, le hook non ;
  3. `echo \<<EOF` : bash lit `\<` comme un caractère puis `<EOF` comme une redirection, il n'y a
     **pas** de heredoc, mais le hook en voit un et masque les lignes suivantes.
- **Impact** : contournement délibéré de la seule règle `.env` (les autres règles lisent la commande
  brute depuis N15). Même classe que les limites déjà acceptées à l'audit 7 ; par ailleurs la liste de
  verbes laisse passer `sort .env`, `tr a a < .env`, `dd if=.env` (vérifié, new = old = 0 ; limite
  documentée `guard-bash.sh:120`). LOW.
- **Correctif attendu (optionnel)** : conserver le corps (ne pas le retirer) si la ligne d'ouverture
  contient `$(` ou si `<<` est précédé d'un antislash ; terminer aussi sur le délimiteur suivi de `)` ;
  joindre les continuations antislash + retour à la ligne pour un délimiteur non quoté. Sinon,
  documenter ces cas comme limites connues.

### [INFO] S4 — Divers garde-fou
- Faux positif G4 : `gh api` en POST sur un commentaire d'issue dont le texte contient « rulesets » est
  bloqué (new = 2, old = 0). Acceptable (échec fermé).
- Entrée `[1,2]` ou `{"tool_input":"…"}` (non objet) : acceptée (0), cohérent avec les cas `raw_ok`
  existants — aucune commande n'est exécutée dans ce cas.

## Périmètre 2 — maquette P01

### Vérifié conforme (faits exécutés)
- **CSP à nonce du L00 préservée** : `apps/*/src/proxy.ts`, `not-found.tsx`, `global-not-found.tsx`
  inchangés (`git diff --quiet ff3cd3e..fdc3794`). En production locale : `script-src 'self'
  'nonce-…' 'strict-dynamic'`, `style-src 'self' 'nonce-…'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`, `frame-ancestors 'none'`. Le seul style inline est `<style nonce>` injecté par
  `packages/ui/src/components/ThemeStyle.tsx:14` avec le nonce lu dans `x-nonce`
  (`apps/*/src/app/[locale]/layout.tsx`) ; aucun attribut `style=""`, aucun `on*=` dans le HTML rendu.
  Parcours e2e complets sans erreur console (donc sans violation CSP).
- **Aucun appel réseau tiers** : aucune URL absolue, `fetch`, `XMLHttpRequest`, `WebSocket`,
  `sendBeacon`, `@import`, `url(`, `next/font`, `next/image` dans `apps/*/src` et `packages/ui/src` ;
  police système uniquement ; tests e2e AC-P01-08 (interception de toutes les requêtes) verts pour les
  deux apps. Aucun `process.env` côté client ; aucun motif de secret dans `.next/static`.
  Observation : pendant la sonde Chromium de cet audit, le proxy de l'environnement a refusé 9
  connexions vers `www.google.com:443` ; elles proviennent des services internes du navigateur, pas
  de la page (les tests e2e, qui capturent les requêtes de la page, n'en voient aucune).
- **`X-Robots-Tag: noindex, nofollow`** (`apps/storefront/next.config.ts:19`,
  `apps/backoffice/next.config.ts:19`, source `/:path*`) : présent sur pages, 404 et assets
  `/_next/static` ; ajouté aussi à `e2e/tests/security-headers.spec.ts`.
- **`localStorage`** : accès encapsulés dans `try/catch` (lecture et écriture, deux apps). Valeurs
  hostiles injectées dans le stockage (`<img src=x onerror=…>` dans nom, téléphone, note, identifiant
  de commande, motif de refus) : 0 nœud injecté, 0 dialogue, 0 erreur — échappement React effectif.
  `{"__proto__":…}` : sans effet (propriété propre, pas de pollution de prototype). JSON invalide :
  retour propre à l'état initial.
- OWASP API Top 10 (BOLA/BFLA, tenant, webhooks, paiements, tokens de suivi, SSRF) : **sans objet**
  dans ce diff (aucune API, aucune authentification, paiement simulé local, identifiant de commande
  `DEMO-…` sans valeur de sécurité).

### [LOW] S5 — État `localStorage` non validé : page blanche persistante si la forme est inattendue
- **Emplacement** : `apps/storefront/src/state/cart-store.tsx:44-49`,
  `apps/backoffice/src/state/service-board-store.tsx:36-37` (fusion `{...initialState, ...parsed}` sans
  contrôle de type) ; plantage en aval `apps/storefront/src/state/cart-calculations.ts:50`,
  `apps/backoffice/src/components/ServiceBoardScreen.tsx:141`.
- **Preuve (Chromium local)** : `lines` = objet → `t.reduce is not a function`, page quasi vide ;
  `orders` = chaîne → `x.orders.filter is not a function`, idem. L'interface d'erreur par défaut de Next
  est elle-même refusée par la CSP (« Refused to apply inline style », `securitypolicyviolation`
  `style-src-elem`), d'où un écran blanc. L'état étant relu à chaque chargement, la panne persiste
  jusqu'au nettoyage manuel du stockage.
- **Impact** : disponibilité de la démonstration dans ce navigateur uniquement (auto-infligé, pas
  d'attaquant distant). Risque réaliste : évolution du schéma entre deux déploiements sans changer la
  clé `-v1`, pendant un rendez-vous commercial.
- **Correctif attendu** : valider la forme (tableaux, chaînes, statuts connus) dans `loadState` et
  revenir à `initialState` sinon ; éventuellement `global-error.tsx` avec nonce.

### [INFO] S6 — Coordonnées invité persistées sans échéance
- **Emplacement** : `apps/storefront/src/state/cart-store.tsx:28`, `:60`, `:154-156`.
- **Constat** : nom, téléphone et note saisis restent dans `localStorage` sans expiration (vérifié :
  `"guest":{"name":"Jean Fictif","phone":"+41 00 000 00 00",…}`). Conforme à la spec §7 pour une
  maquette ; mais le téléphone du porteur passera de main en main en rendez-vous : ajouter une mention
  « données fictives » en placeholder et ne pas reprendre ce motif en production (données personnelles
  hors `localStorage`, ou `sessionStorage` + effacement après commande).

### [INFO] S7 — Générateur CSS de thème sans neutralisation (à traiter avant tout thème tenant)
- **Emplacement** : `packages/ui/src/tokens/to-css.ts:33-36`, injecté par
  `packages/ui/src/components/ThemeStyle.tsx:14` (`dangerouslySetInnerHTML`).
- **Constat** : valeurs de tokens concaténées telles quelles dans un `<style>`. Sans risque aujourd'hui
  (thème statique du paquet), mais une valeur contenant `</style>`, `;`, `}` ou `url(` fournie par un
  tenant (L05, « contenus de marque ») permettrait une injection HTML/CSS. Exiger une validation
  stricte par type de token (couleur, longueur, liste de polices) avant tout usage avec des données
  tenant.

### [INFO] S8 — Netlify : hypothèses à vérifier par le porteur
- `apps/*/netlify.toml` : commande `pnpm install --frozen-lockfile`, pas de secret, pas d'en-têtes
  ajoutés (dépend du runtime Next de Netlify pour appliquer `next.config.ts` et `proxy.ts` —
  **hypothèse**, bien signalée dans `deploiement-netlify.md`).
- **Hypothèses supplémentaires** : les « deploy previews » / branch deploys sont publics par défaut et
  Netlify peut y injecter une barre d'outils (script tiers, qui serait bloqué par la CSP et produirait
  des erreurs console) : désactiver ou protéger ces aperçus. Après le premier déploiement, vérifier par
  `curl -I` la présence de `Content-Security-Policy` (nonce différent à chaque requête) et de
  `X-Robots-Tag` sur une page et un asset. `X-Robots-Tag` ne remplace pas un contrôle d'accès.

## Verdict

**CHANGES_REQUIRED** (équivalent du « CHANGES_REQUESTED » demandé) — aucun BLOCKER ni HIGH ; aucune
régression du garde-fou (107/107 anciens cas, 127/127 au total), échec fermé préservé, N17 résolu sans
affaiblir la règle `.env`, maquette P01 conforme (CSP à nonce intacte, aucun appel tiers, noindex
partout, `localStorage` protégé). Seul **S1 (MEDIUM)** motive le verdict : G4 est présenté comme appliqué
par le hook alors que des variantes courantes et le canal MCP réellement utilisé pour fusionner y
échappent. Selon `workflow-lots.md` (étape 5), S1 doit être corrigé (hook) ou justifié par écrit avec
vérification côté serveur par le porteur, puis contre-audité. S2, S3, S5 (LOW) et les INFO peuvent être
planifiés.

Rappel : revue automatisée par un agent ; **un test d'intrusion externe par un humain reste requis
avant commercialisation.**
