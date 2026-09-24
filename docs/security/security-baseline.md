# Socle de sécurité

## Identité et accès
- Personnel : OIDC (Authorization Code + PKCE), MFA/passkey obligatoire pour owner/manager, fortement
  recommandé pour les autres ; sessions serveur (cookie `__Host-`, `Secure`, `HttpOnly`, `SameSite=Strict`),
  inactivité max 12 h sur tablette de service (configurable), durée absolue 7 j ; rotation à la connexion.
- Réauthentification (≤ 5 min) pour : remboursement au-delà du plafond, export massif, modification du
  compte de paiement, changement de rôle critique, résiliation.
- RBAC côté API ; refus par défaut ; permissions nommées ; test garantissant qu'aucune route admin n'est
  sans permission.
- Révocation : suppression des sessions actives du membre à la révocation.

## Application
- Validation stricte (Zod) · encodage de sortie (React) · requêtes paramétrées (Drizzle) · CSRF (cookies
  SameSite + jeton sur mutations) · CSP stricte avec nonces · HSTS · `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` · CORS restreint.
- Rate limiting (Redis) : par IP, compte, tenant, opération ; renforcé sur connexion, coupon, paiement,
  remboursement, suivi public, adresse, SMS.
- Uploads : types et tailles limités, ré-encodage des images, stockage privé + URL signées/CDN.

## Secrets et chiffrement
- Coffre de secrets par environnement ; jamais dans le dépôt ; fichier d'exemple sans valeur.
- TLS partout ; chiffrement au repos du fournisseur ; chiffrement applicatif (AES-256-GCM, enveloppe) des
  champs sensibles ; recherche par HMAC ; rotation de clé annuelle et sur incident (procédure à écrire au L01).

## Chaîne logicielle
- Lockfile, installation verrouillée, audit des dépendances, gitleaks, scan d'image, SBOM par version de
  production, Renovate/Dependabot avec revue humaine.
- SLA interne de correctif proposé : critique 48 h, élevé 7 j, moyen 30 j.

## Journalisation
- Logs JSON avec `correlationId`, `tenantId`, `route`, `status`, `durationMs` ; liste d'autorisation de
  champs ; aucune donnée personnelle ni secret ; audit métier séparé (`audit_log`).

## Garde-fous des agents IA
- `.claude/settings.json` : refus de lecture des fichiers de secrets, du push forcé, de `tofu apply/destroy`.
- `.claude/hooks/guard-bash.sh` et `guard-files.sh` : blocage indépendant de la décision du modèle ;
  tests dans `.claude/hooks/test-guards.sh` (à intégrer à la CI au L00).
- Aucun identifiant de production dans l'environnement des agents ; `main` protégée ; CI obligatoire.
