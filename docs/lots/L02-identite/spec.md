# Lot L02 — Identité du personnel, rôles et journal d'audit

- **Statut** : PROPOSÉ
- **Validé par / le** : _à compléter par le porteur_          ← requis avant toute implémentation (lot critique)
- **Critique** : **OUI** (authentification, autorisations) → `auditor-opus` **et** `security-opus`
- **ADR liés** : 0004 (tenancy), 0009 (OIDC — fournisseur à choisir, décision D7), 0013
- **Pré-requis** : L01 `APPROVED` ; **décision D7 (fournisseur OIDC) prise par le porteur**
- **Branche** : branche de développement désignée pour la session

## 1. Besoin et contexte

Toute action du back-office doit être faite par une personne identifiée, dans un tenant qu'elle a le droit
de gérer, avec une permission explicite, et laisser une trace. Ce lot pose ces mécanismes une fois pour
toutes ; les lots métier ne feront que déclarer leurs permissions.

## 2. Périmètre

### Inclus
1. **Connexion OIDC** (Authorization Code + PKCE) côté `apps/backoffice` → API, derrière un port
   `IdentityProvider` (adaptateur réel pour le fournisseur choisi en D7 + adaptateur factice pour les tests
   et le développement local, ex. serveur OIDC de test en conteneur).
2. **Sessions serveur** : table `staff_session` (id aléatoire ≥ 128 bits, hash stocké, `user_id`,
   `created_at`, `last_seen_at`, `expires_at`, `revoked_at`, `mfa_at`, `ip_hash`, `user_agent_hash`) ;
   cookie `__Host-session` `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` ; inactivité 12 h max,
   durée absolue 7 j ; rotation de l'identifiant à la connexion et à l'élévation (réauth).
3. **Tables** : `platform_user` (identité technique, `oidc_subject` unique, e-mail **chiffré** + hash HMAC
   de recherche), `role`, `permission`, `role_permission` (rôles système : owner, manager, staff, driver,
   accountant ; permissions nommées), `membership` (T, RLS : `user_id`, `tenant_id`, portée
   restaurant/établissement optionnelle, `role_id`, `status`, `revoked_at`).
4. **Chiffrement applicatif** des champs sensibles (AES-256-GCM, enveloppe, clé par environnement via
   variable d'environnement en dev, coffre plus tard) + HMAC de recherche ; utilitaire dans `packages/db`
   ou `packages/domain` (sans dépendance réseau) ; rotation documentée.
5. **Résolution du contexte** : middleware API qui lit la session → utilisateur → membership active pour le
   tenant sélectionné (en-tête `x-tenant-id` **vérifié contre les memberships**, jamais cru) → `TenantContext`
   → `withTenant` (L01).
6. **RBAC** : décorateur `@RequirePermission('x.y')` ; garde globale **refus par défaut** ; test qui échoue si
   une route `/v1/admin/**` n'a pas de décorateur de permission.
7. **MFA obligatoire** pour owner et manager : la session doit porter une preuve de MFA récente fournie par
   le fournisseur (claim `amr`/`acr` vérifié) ; sinon 403 `MFA_REQUIRED`. Réauthentification (≤ 5 min) exigée
   par décorateur `@RequireRecentAuth()` pour les actions sensibles (utilisé à partir de L11).
8. **Révocation immédiate** : révoquer une membership invalide les sessions actives de ce membre pour ce
   tenant (test).
9. **Audit** : écriture `audit_log` (table créée au L01) pour connexion, déconnexion, échec d'autorisation,
   création/modification/révocation de membership, changement de rôle ; avec `correlationId`.
10. **Routes** : `GET /v1/admin/me` (utilisateur, memberships, permissions effectives),
    `POST /v1/auth/logout`, `CRUD /v1/admin/members` (permission `member.manage`, réauth pour rôle owner/manager),
    flux de connexion/rappel OIDC.
11. **Back-office** : page de connexion, sélection du tenant si plusieurs memberships, page « Mon compte »,
    page « Équipe » minimale (lister, inviter par e-mail — **invitation sans envoi réel au L02**, lien affiché
    à l'opérateur —, changer de rôle, révoquer).
12. **Protection CSRF** des mutations par cookie (jeton synchronisé ou double soumission + vérification
    d'`Origin`).
13. **Rate limiting** (Redis) sur connexion, rappel OIDC et routes membres.

### Exclu
Comptes clients (après pilote), passkeys gérées par nous (déléguées au fournisseur), SSO entreprise,
accès support temporaire outillé (procédure manuelle au pilote), envoi d'e-mails d'invitation (L12).

## 3. User stories
US-R12 (gérer les employés, révoquer immédiatement), US-P04 partiel (traçabilité), US-R15 (journal d'audit).

## 4. Critères d'acceptation
- **AC-L02-01** Un utilisateur non connecté reçoit 401 sur toute route `/v1/admin/**`.
- **AC-L02-02** Un utilisateur connecté sans membership pour le tenant demandé reçoit 404 (pas 403, pour ne
  pas révéler l'existence) ; `x-tenant-id` d'un tenant non autorisé n'a aucun effet.
- **AC-L02-03** Un `staff` n'accède pas à `member.manage` (403) ; un `owner` oui ; matrice rôle × permission
  testée exhaustivement à partir de la table de référence.
- **AC-L02-04** Un owner/manager sans preuve MFA reçoit 403 `MFA_REQUIRED` sur les routes admin.
- **AC-L02-05** Révoquer un membre invalide sa session : sa requête suivante reçoit 401/404 (test).
- **AC-L02-06** Cookie de session : attributs `Secure`, `HttpOnly`, `SameSite=Strict`, préfixe `__Host-` ;
  identifiant régénéré à la connexion (test de fixation).
- **AC-L02-07** Expiration : session inactive > 12 h ou âgée > 7 j refusée (horloge injectable).
- **AC-L02-08** Mutation sans jeton CSRF valide ou avec `Origin` étranger → 403.
- **AC-L02-09** Test garde-fou : toute route `/v1/admin/**` sans `@RequirePermission` fait échouer la suite.
- **AC-L02-10** E-mail du personnel chiffré en base (lecture SQL brute ≠ clair) ; recherche par HMAC fonctionne.
- **AC-L02-11** Chaque action listée § 2.9 produit une entrée `audit_log` avec `correlationId` ; aucune
  donnée sensible (token, e-mail en clair) dans `diff`.
- **AC-L02-12** Isolation : harnais L01 étendu à `membership` et `staff_session` (si scoped).
- **AC-L02-13** Rate limit : > N tentatives de connexion par IP et par minute → 429.
- **AC-L02-14** E2E : connexion via le fournisseur factice → sélection du tenant → page Équipe → révocation.
- **AC-L02-15** Aucun secret OIDC ni clé de chiffrement dans le dépôt ; `.env.example` complété avec des
  valeurs factices et explicites.

## 5. Contrat API
Routes § 2.10 ; erreurs `UNAUTHENTICATED` (401), `NOT_FOUND` (404), `FORBIDDEN` (403), `MFA_REQUIRED` (403),
`REAUTH_REQUIRED` (403), `CSRF_INVALID` (403), `RATE_LIMITED` (429). Schémas dans `packages/contracts`.

## 6. Modèle de données
Voir § 2.2–2.3 ; colonnes détaillées reportées dans `docs/architecture/data-model.md` par l'implémenteur ;
migrations up/down ; RLS forcée sur `membership` (et `staff_session` si elle porte `tenant_id`).

## 7. Sécurité et tenancy
Menaces M6 (prise de compte), M5 (BFLA), M13 (accès opérateur), M1 (accès croisé). Revue `security-opus`
obligatoire (OWASP ASVS V2 authentification, V3 sessions, V4 contrôle d'accès).

## 8. Plan de test
Unitaires : matrice RBAC, expiration, chiffrement/HMAC. Intégration : OIDC factice, sessions, révocation,
CSRF, rate limit, audit. Isolation : harnais L01. E2E : AC-L02-14.

## 9. Observabilité
Logs : `userId` (UUID), `tenantId`, décision d'autorisation (allow/deny + permission), jamais le token.
Métriques : échecs de connexion, refus d'autorisation, 429.

## 10. Risques et questions ouvertes
- **D7 bloquante** : fournisseur OIDC (recommandé : Zitadel ; vérifier région, prix, passkeys, claim `amr`).
- Claim MFA variable selon le fournisseur → adaptateur qui normalise ; à valider en audit de spec.
- Tablette de service partagée : 12 h d'inactivité est un compromis confort/sécurité — à valider avec le pilote.

## 11. Temps (heures du porteur)
| Cadrage | Validation/revue | Tests manuels | Total |
|---|---|---|---|
| | | | |
