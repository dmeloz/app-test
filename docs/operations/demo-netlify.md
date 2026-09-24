# Démonstration de la maquette P01 sur Netlify

> Décision D-P01-1 (porteur, 2026-09-24). Ce document prépare la mise en ligne ; **aucun compte n'est
> créé ni aucun déploiement fait par un agent**.

## Vérifications effectuées (2026-09-24)

| Point | Résultat | Source / statut |
|---|---|---|
| Support Next.js par Netlify | Le runtime `@netlify/plugin-nextjs` **5.16.0** annonce « Next.js 13.5 or later » et indique que Next.js est « supported natively on Netlify » | README du paquet sur le registre npm — **vérifié** |
| Next.js 16 et `proxy.ts` (CSP à nonce du L00) | Non confirmé explicitement | `docs.netlify.com` inaccessible depuis l'environnement de développement (proxy réseau) — **à vérifier** au premier déploiement (en-tête `Content-Security-Policy` avec nonce présent, 0 erreur console) |
| Offre gratuite pour une démonstration commerciale | Non vérifié | **À vérifier par le porteur** dans les conditions Netlify |
| Protection par mot de passe | Non vérifié (historiquement réservée à certaines offres) | **À vérifier** ; alternative : lien non indexé + en-tête `X-Robots-Tag: noindex` |
| Résidence des données | Hors Suisse probable | Acceptable : la maquette ne contient **aucune donnée réelle ni personnelle** |

## Procédure (à faire par le porteur, avec l'aide de Claude)

1. ~~Créer un compte Netlify~~ — **le porteur a déjà un compte (2026-09-24).** Autoriser l'accès au dépôt GitHub `dmeloz/app-test`.
2. Créer **un site par application** :
   - `storefront` : base directory `apps/storefront` ;
   - `backoffice` : base directory `apps/backoffice`.
   Monorepo pnpm : Netlify détecte en principe pnpm via `packageManager` ; commandes et versions exactes
   figées dans `netlify.toml` (préparé par l'agent au lot P01).
3. Branche de production du site de démo : la branche de la maquette (pas `main` tant que P01 n'est pas fusionné).
4. Variables : `NODE_VERSION` = contenu de `.nvmrc` ; aucune variable secrète n'est nécessaire.
5. Après le premier déploiement : vérifier sur téléphone le bandeau « Démonstration », les en-têtes de
   sécurité, 0 erreur console, puis partager le lien uniquement en direct avec les restaurants démarchés.

## Contrôles avant de montrer la démo

- [ ] Bandeau « Démonstration — aucune commande réelle » visible sur chaque page.
- [ ] Aucun formulaire n'envoie de données hors du navigateur.
- [ ] Indexation désactivée (`X-Robots-Tag: noindex` et `robots.txt` Disallow).
- [ ] Nom du restaurant fictif ne correspondant à aucun établissement réel.
