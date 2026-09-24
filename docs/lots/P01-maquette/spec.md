# Lot P01 — Maquette cliquable de démonstration

- **Statut** : VALIDÉ
- **Validé par / le** : le porteur (« Je valide et tu as carte blanche ») / 2026-09-24
- **Critique** : non (aucune donnée réelle, aucun paiement, aucune base) → audit `auditor-opus` allégé
- **ADR liés** : 0010 (deux apps Next), 0015 (design tokens)
- **Pré-requis** : L00 `APPROVED`
- **Branche** : branche de développement désignée pour la session

## 1. Besoin et contexte

Aucun restaurant pilote n'est encore trouvé ; c'est le principal risque du projet. Une maquette mobile
cliquable permet (1) de démarcher des restaurants, (2) de valider l'expérience de commande et de service
avant de construire le métier réel, (3) de rendre l'avancement visible. Elle est construite **dans les
vraies applications et le vrai design system** pour que le travail soit réutilisé aux lots L04/L05 et non
jeté.

## 2. Périmètre

### Inclus — 4 écrans, mobile d'abord, FR/EN
1. **Accueil du restaurant** (storefront) : nom, visuel, statut ouvert/fermé, délai estimé, choix
   **Retrait / Livraison** mis en avant, adresse et horaires.
2. **Menu** : catégories, produits avec photo (images libres de droits ou placeholders), variantes, groupes
   d'options (min/max), suppléments non présélectionnés, **allergènes visibles avant ajout**, produit en
   rupture grisé ; barre de panier fixe en bas avec total.
3. **Panier et créneau** : lignes modifiables, frais et minimum affichés, choix « dès que possible » ou
   créneau (créneaux fictifs dont un complet), formulaire invité minimal, bouton « Payer » qui mène à un
   écran **« Paiement simulé — démonstration »** puis à la page de suivi (Acceptée → En préparation → Prête,
   états avancés manuellement ou par minuterie de démo).
4. **Tableau de service** (backoffice) : colonnes Nouvelles / En préparation / Prêtes, carte de commande
   (numéro, créneau, lignes, options, note client), boutons Accepter / Refuser (motif) / Prête, bouton
   **Pause des commandes**, bascule rupture d'un produit ; alerte visuelle (et sonore optionnelle) à
   l'arrivée d'une commande fictive.

### Principes de construction
- Composants dans `packages/ui` (boutons, carte produit, sélecteur d'options, barre de panier, carte de
  commande), stylés **uniquement par design tokens** (ADR 0015) ; un thème de démonstration dans
  `packages/ui/themes/demo`.
- Textes dans `packages/i18n` (FR/EN), aucun texte en dur.
- **Données fictives isolées** : `apps/storefront/src/mock/` et `apps/backoffice/src/mock/` uniquement,
  typées avec des types provisoires ; aucun import de `mock/` depuis `packages/*` (règle de frontières).
  Restaurant fictif « Le Petit Lausannois » (nom inventé ; vérifier qu'il ne correspond à aucun établissement
  réel connu, sinon en choisir un autre). Aucune donnée personnelle réelle.
- **Bandeau permanent « Démonstration — aucune commande réelle »** sur toutes les pages, non masquable.
- État du panier et des commandes de démo : en mémoire côté client (et `localStorage` pour survivre à un
  rechargement) ; **aucun appel à l'API**, aucune base.
- Montants affichés en CHF à partir d'entiers en centimes (formatage `Intl` `fr-CH`/`en-CH`) — même
  si fictifs, pour ne pas prendre de mauvaises habitudes.
- Accessibilité : cibles ≥ 44×44 px, navigation clavier, libellés ARIA, contraste AA du thème de démo.

### Exclu
API, base de données, authentification, paiement réel ou SDK Stripe, calcul de prix côté serveur,
multi-restaurant, domaines, PWA hors ligne, envoi d'e-mail. Aucune de ces simulations ne doit être
présentée comme fonctionnelle.

## 3. User stories
- **US-P01-1** En tant que porteur, je montre sur mon téléphone à un restaurateur le parcours complet
  client → cuisine en moins de 3 minutes.
- **US-P01-2** En tant que restaurateur démarché, je comprends immédiatement que c'est mon site, à mon
  image, et comment mon équipe recevrait les commandes.

## 4. Critères d'acceptation
- **AC-P01-01** Les 4 écrans existent en FR et EN, navigables sur un écran de 375 px de large sans défilement horizontal.
- **AC-P01-02** Parcours e2e (Playwright, viewport mobile) : accueil → Retrait → ajout d'un produit avec option obligatoire → panier → créneau → paiement simulé → suivi « Prête » ; aucune erreur console.
- **AC-P01-03** Parcours e2e backoffice : une commande fictive apparaît, Accepter → Prête ; Pause affiche l'état en pause.
- **AC-P01-04** Un groupe d'options min=1 empêche l'ajout sans sélection ; max=2 empêche une 3e sélection (test unitaire du composant).
- **AC-P01-05** Aucun supplément payant n'est présélectionné (test).
- **AC-P01-06** Allergènes affichés sur la carte produit avant ajout (test).
- **AC-P01-07** Bandeau « Démonstration » présent sur chaque page (test e2e sur toutes les routes).
- **AC-P01-08** Aucun appel réseau vers l'API ni vers un domaine tiers pendant le parcours (e2e : interception des requêtes, seules les ressources de l'app sont chargées).
- **AC-P01-09** Tests axe : aucune violation « serious » ou « critical » sur les 4 écrans.
- **AC-P01-10** Toutes les vérifications du L00 restent vertes (format, lint dont frontières, typecheck, tests, build, e2e).
- **AC-P01-11** Les composants de `packages/ui` n'importent aucune donnée fictive.

## 5. Contrat API / 6. Modèle de données
Aucun. Types provisoires dans `mock/`, marqués `// provisoire — remplacé par packages/contracts au L04`.

## 7. Sécurité
Pas de donnée personnelle ; saisie du formulaire invité conservée uniquement dans le navigateur ; CSP du
L00 conservée ; aucun script tiers ; images servies localement.

## 8. Accès à la maquette sur téléphone — **décision du porteur requise (D-P01-1)**
Options (coûts et conditions **à vérifier** avant choix, rien n'est activé sans accord) :
1. **Local uniquement** : `pnpm dev` et ouverture sur le téléphone via le réseau local — gratuit, mais
   uniquement depuis ton ordinateur.
2. **Hébergeur de démonstration pour Next.js** (ex. Vercel, Netlify, Cloudflare) : lien public
   partageable ; vérifier que l'offre gratuite autorise un usage de démonstration commerciale, la région, et
   protéger l'accès (mot de passe ou lien non indexé).
3. **Hébergeur suisse retenu plus tard (ADR 0012)** : anticipe le choix d'hébergement, plus de mise en place.

Recommandation : option 2 avec accès protégé, en attendant l'ADR 0012.

**Décision D-P01-1 (porteur, 2026-09-24) : Netlify.** À vérifier par l'agent avant configuration, dans la
documentation officielle : prise en charge de Next.js 16 (App Router, proxy/middleware utilisé par la CSP
à nonce du L00) par le runtime Netlify, conditions de l'offre gratuite pour une démonstration, protection
d'accès disponible (mot de passe / en-tête `X-Robots-Tag: noindex`). L'agent fournit `netlify.toml` et la
procédure ; la création du compte et la connexion du dépôt sont faites par le porteur. Hébergement hors
Suisse acceptable ici : aucune donnée personnelle ni réelle. Le déploiement lui-même est une
action humaine (compte, domaine) ; l'agent prépare seulement la configuration et la documentation.

## 9. Plan de test
Unitaires (composants options, formatage monétaire, bandeau) · e2e mobile (AC-02, 03, 07, 08) · axe (AC-09).

## 10. Risques
- Maquette prise pour un produit fini → bandeau obligatoire + discours clair lors des démarches.
- Dérive vers du métier réel → aucune API, revue d'audit sur l'absence d'appels réseau.
- Temps pris sur le socle → périmètre borné à 4 écrans, estimation 1–1,5 semaine.

## 11. Fichiers attendus (indicatif)
`packages/ui/src/{components,themes/demo}/**`, `packages/i18n/src/**`, `apps/storefront/src/{app,mock,components}/**`,
`apps/backoffice/src/{app,mock,components}/**`, `e2e/tests/demo-*.spec.ts`, `docs/lots/P01-maquette/implementation-report.md`.

## 12. Temps (heures du porteur)
| Cadrage | Validation/revue | Tests manuels | Démarchage restaurants | Total |
|---|---|---|---|---|
| | | | | |
