# ADR 0009 — Identité : OIDC géré pour le personnel, commande invité pour les clients

- **Statut** : Proposé — fournisseur à choisir avant L02 · **Date** : 2026-09-24

## Contexte
MFA/passkey obligatoire pour owner/manager, révocation immédiate, auto-hébergement futur, coût minimal.

## Options (fournisseur)
1. Zitadel (open source, auto-hébergeable, offre cloud) 2. Keycloak (auto-hébergé) 3. Auth0 / Okta
4. Microsoft Entra External ID 5. Authentification maison (écartée : risque élevé).

## Décision proposée
OIDC standard (Authorization Code + PKCE) côté back-office ; sessions serveur ; rôles et memberships
gérés **dans notre base** (le fournisseur ne gère que l'authentification et la MFA). Recommandation :
Zitadel, sous réserve de vérifier région d'hébergement, prix et prise en charge des passkeys.
Clients finaux : commande invité ; comptes clients après pilote (même mécanisme OIDC ou lien magique).

## Conséquences
+ Pas de stockage de mots de passe ; MFA déléguée ; portabilité (standard). − Dépendance à un tiers pour
la connexion du personnel → procédure de secours documentée.

## Réversibilité
Élevée : `platform_user.oidc_subject` + mapping ; changement de fournisseur = migration des sujets.
