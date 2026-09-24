# Rendu et CSP (storefront, back-office)

> Contexte : `docs/lots/L00-socle/audit-1.md` (M1), `docs/lots/L00-socle/audit-2.md` (M1, partiel).
> Concerne `apps/storefront` et `apps/backoffice` (Next.js App Router, Next 16.3.6).

## Pourquoi la CSP impose un rendu dynamique

`src/proxy.ts` (les deux apps) calcule un nonce **par requête** (`crypto.randomUUID()`) et pose un
en-tête `Content-Security-Policy` avec `script-src 'nonce-<valeur>' 'strict-dynamic'` et
`style-src 'nonce-<valeur>'` (pas de `'unsafe-inline'` en production). Pour que les scripts et styles
inline générés par Next lui-même (bootstrap, hydratation RSC) soient autorisés, le HTML servi doit
contenir exactement ce même nonce sur chaque balise `<script>`/`<style>` inline.

Un nonce recalculé à chaque requête ne peut être injecté que si la page est **rendue à la demande**.
Une page prérendue au build (Static Rendering) n'a pas de requête au moment de sa génération : elle
ne peut donc porter aucun nonce, ou un nonce figé qui ne correspondra jamais à celui de l'en-tête
CSP envoyé pour une requête ultérieure — dans les deux cas, le navigateur bloque les scripts/styles
inline (« Refused to execute/apply... »).

**Conséquence appliquée** : `[locale]/layout.tsx` (les deux apps) appelle `await connection()`
(`next/server`) pour forcer un rendu dynamique par requête (`ƒ` dans la sortie de `next build`, pas
`○`). Toute page nouvelle ajoutée sous `[locale]/` en hérite automatiquement (le layout englobe tout).

## Le piège des pages 404 (audit 1 M1, partiel ; audit 2 M1)

Deux mécanismes Next distincts gèrent les 404, et **aucun des deux n'est nested sous
`[locale]/layout.tsx`** par défaut — donc aucun n'hérite du `connection()` posé là :

1. **Route totalement non reconnue** (aucun segment de fichier ne correspond, ex. `/fr/inexistant`,
   qui a un segment de trop par rapport à `app/[locale]/page.tsx`) : gérée par Next **avant même
   d'entrer dans l'arbre de layouts**, via la route spéciale `/_not-found`. Par défaut, prérendue au
   build (`○`), avec le contenu 404 intégré à Next (`next/dist/client/components/builtin/not-found.js`
   → `HTTPAccessErrorFallback`), qui pose un `<style>` et des attributs `style` **en ligne, sans
   nonce**.
2. **`notFound()` levé pendant le rendu d'un segment déjà matché** (ex. `/xx` : le segment `[locale]`
   correspond, mais `xx` n'est pas une locale supportée) : Next cherche la limite `not-found.tsx` la
   plus proche **au-dessus du point où l'erreur est levée**. Un layout qui appelle lui-même
   `notFound()` avant de rendre ses enfants **court-circuite sa propre limite** (elle enveloppe les
   enfants du layout, pas le layout) : l'erreur remonte à la limite du segment parent — ici la racine,
   qui n'a pas de `app/layout.tsx` (modèle i18n : `[locale]/layout.tsx` fait office de layout racine,
   cf. doc Next 16 « Internationalization », `app/[lang]/layout.js`) et retombe donc, elle aussi, sur
   le contenu 404 intégré par défaut.

Dans les deux cas, le nonce de l'en-tête CSP (posé par `proxy.ts`, qui s'exécute sur **toute**
requête, y compris les 404) ne correspond à aucun nonce présent dans le HTML — ou le contenu par
défaut de Next pose carrément des styles/scripts inline sans nonce du tout. Constat de l'audit 2 :
14 erreurs CSP en console sur les pages 404, uniquement.

### Correctifs appliqués

- **`app/global-not-found.tsx`** (nouveau, racine de chaque app, hors `[locale]/`) + `next.config.ts`
  → `experimental.globalNotFound: true`. Gère le cas 1 (route totalement non reconnue) : convention
  Next 16 documentée précisément pour les architectures « root layout défini par un segment
  dynamique de premier niveau » (notre cas). Doit fournir son propre document `<html>`/`<body>` (il
  « bypass » le rendu normal) et appelle `await connection()` pour forcer le rendu dynamique.
- **`app/not-found.tsx`** (nouveau, racine de chaque app, hors `[locale]/`). Gère le cas 2
  (`notFound()` levé pour une locale non supportée) : la vérification `isSupportedLocale` a été
  **retirée de `generateMetadata` et du corps de `[locale]/layout.tsx`** (elle y court-circuitait la
  limite `not-found.tsx` propre au segment, comme expliqué ci-dessus) et ne subsiste que dans
  `[locale]/page.tsx`, un enfant réel du layout — l'erreur qu'il lève y est alors correctement
  interceptée par la limite `not-found.tsx` la plus proche, qui est celle-ci (racine, car
  `[locale]/layout.tsx` n'en déclare pas de spécifique). Même raison qu'au point précédent : fournit
  son propre document complet et force le rendu dynamique.
- Les deux composants sont volontairement minimalistes et bilingues (FR + EN sur la même page,
  aucune locale fiable connue à ce stade de la résolution de route) : `<p lang="fr">…</p>` /
  `<p lang="en">…</p>`, sans style, sans script — rien qui puisse être bloqué par la CSP.
- Preuve automatisée : `e2e/tests/not-found.spec.ts` (`/fr/inexistant` et `/xx`, les deux apps) —
  statut 404, en-tête CSP présent, nonce de l'en-tête retrouvé dans le HTML servi (même méthode que
  `security-headers.spec.ts`), 0 erreur console/CSP inattendue.

## Conséquence : pas de cache CDN pour le HTML

Le rendu dynamique par requête implique `Cache-Control: private, no-cache, no-store, max-age=0,
must-revalidate` sur le HTML de toutes les pages concernées (confirmé par les en-têtes observés en
local, `next start`) : **aucune page HTML n'est mise en cache par un CDN/reverse proxy** en l'état.
Les assets statiques (`/_next/static/**`) restent, eux, immuables et cachables normalement (hashés
par contenu, non concernés par le nonce).

Pour un site à fort trafic, ceci a un coût de performance et d'infrastructure (chaque requête HTML
retraverse le rendu serveur) — acceptable au lot L00 (aucun trafic réel), à réévaluer avant montée en
charge.

## Alternatives futures (non retenues au L00)

- **CSP par hash** (`'sha256-...'` des scripts/styles inline connus à l'avance) au lieu d'un nonce :
  permettrait un rendu statique/caché, mais Next génère lui-même des scripts de bootstrap dont le
  contenu (donc le hash) peut varier d'une build à l'autre et n'est pas garanti stable par app ; plus
  fragile à maintenir manuellement, et ne couvre pas facilement un contenu généré dynamiquement
  (thème par tenant, L05+).
- **Cache par tenant au niveau du reverse proxy**, avec un nonce généré et injecté à ce niveau plutôt
  que par Next (modèle « edge » : le proxy réécrit le HTML pour substituer le nonce à chaque requête
  tout en servant un corps HTML mis en cache) — envisageable quand un reverse proxy dédié sera en
  place (multi-domaine par tenant, L05+ / infra de production), hors périmètre du socle L00.
- Combinaison des deux : hash pour les scripts Next connus et stables, nonce uniquement pour le
  contenu vraiment dynamique par requête.

## Contrainte pour le moteur de thème (L05)

Le moteur de thème par tenant (design tokens CSS, `packages/ui`) **ne doit produire aucun style en
ligne** (`style="..."` sur un élément, ou `<style>` sans nonce) : avec `style-src 'nonce-...'` (sans
`'unsafe-inline'`) en production, tout style inline non nonce serait bloqué par la CSP, exactement
comme les pages 404 avant correctif. Les tokens de thème doivent être livrés via une feuille de style
externe (fichier CSS chargé par `<link>`, ou variables CSS injectées via une balise `<style>` qui,
elle, porte le nonce de la requête si elle est posée côté serveur). Ce constat, déjà valable en
architecture, est renforcé par le bug corrigé dans ce document : toute future page ou composant qui
utiliserait `style={{ ... }}` (React) ou un `<style>` sans le nonce transmis par `src/proxy.ts`/le
layout reproduira exactement le même échec CSP.
