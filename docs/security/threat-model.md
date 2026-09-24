# Modèle de menaces (STRIDE + OWASP API Top 10 2023)

> Statut : PROPOSÉ — première version, revue par `security-opus` à chaque lot critique. Ne remplace pas un
> test d'intrusion externe (obligatoire avant commercialisation).

## Actifs

Fonds des clients (paiements, remboursements) · intégrité des prix et taxes · données personnelles
clients · comptes du personnel · isolation entre restaurants · déclarations allergènes · disponibilité
pendant les services · réputation du restaurant (site à son nom) · secrets (Stripe, OIDC, chiffrement).

## Acteurs de menace

Client malveillant (manipulation de prix, fraude, énumération) · employé malveillant ou compte volé
(remboursements abusifs, export) · autre tenant (accès croisé) · attaquant externe (injection, SSRF,
credential stuffing, DoS aux heures de pointe) · fournisseur compromis (script tiers, webhook forgé) ·
agent IA mal guidé (commande destructive, fuite de secret).

## Frontières de confiance

Navigateur ↔ storefront/back-office · front ↔ API · API ↔ PostgreSQL (RLS) · API ↔ fournisseurs ·
webhooks entrants · opérateur plateforme ↔ données tenant · agents IA ↔ dépôt et environnements.

## Menaces principales et contrôles

| # | Menace | STRIDE / OWASP | Contrôles | Test |
|---|---|---|---|---|
| M1 | Accès aux commandes d'un autre restaurant via id | I, E / API1 BOLA | Tenant serveur, filtre repository, RLS forcée, FK composites, 404 | Harnais d'isolation (API + SQL) |
| M2 | Client modifie le prix/total | T / API3, API6 | Recalcul serveur intégral, total client ignoré | Unitaires pricing, e2e avec requête forgée |
| M3 | Webhook Stripe forgé ou rejoué | S, T / API8, API10 | Signature sur corps brut, tolérance temporelle, dédup `event.id`, vérif `event.account` ↔ commande | Intégration webhook signé/invalide/rejoué |
| M4 | Double paiement / double commande | T | `Idempotency-Key`, unique (`tenant_id`,`idempotency_key`), clés Stripe idempotentes | Test de concurrence |
| M5 | Remboursement abusif par un employé | E, R / API5 BFLA | Permission `refund.create`, plafond par rôle, approbation + réauth, audit, alerte volumes | Tests de permission et plafond |
| M6 | Prise de compte du personnel | S / API2 | OIDC, MFA/passkey obligatoire owner/manager, sessions courtes, révocation immédiate, rate limit | Tests révocation, MFA requis |
| M7 | Énumération des tokens de suivi | I / API4 | 128 bits, hash stocké, expiration, rate limit, données minimales | Test rate limit |
| M8 | XSS via contenus de marque ou noms de produits | T / ASVS V5 | Markdown assaini, pas de HTML/CSS/JS arbitraire, encodage de sortie, CSP | Tests de payloads XSS |
| M9 | SSRF via URL de média ou webhook sortant | I / API7 | Upload direct S3 signé, pas de fetch d'URL arbitraire ; allowlist, blocage IP privées | Tests SSRF |
| M10 | Saturation des créneaux (réservations fantômes) | D / API4 | Expiration des réservations, rate limit, limite de commandes en attente | Test d'expiration |
| M11 | Données personnelles dans les logs | I | Logger à liste d'autorisation de champs, redaction | Test d'échantillon de logs |
| M12 | Domaine personnalisé détourné (DNS pendant) | S | Preuve DNS (TXT), revérification périodique, désactivation si perte de contrôle | Après pilote |
| M13 | Opérateur accède aux données sans justification | E, R | `support_access_grant` temporaire, audité, visible par le tenant | Test d'audit |
| M14 | Information allergène erronée | T (sécurité alimentaire) | Validation humaine obligatoire, historique, pas de génération automatique | Test de publication bloquée |
| M15 | Agent IA exécute une commande destructive ou lit un secret | E, I | Hooks PreToolUse, deny-list, pas d'identifiants production, CI obligatoire, revue humaine | `.claude/hooks/test-guards.sh` |
| M16 | Dépendance compromise | T / supply chain | Lockfile, audit, SBOM, épinglage, revue humaine des nouvelles dépendances | CI |
| M17 | Déni de service aux heures de pointe | D / API4 | Rate limiting, cache menu, WAF, dimensionnement, mode pause | Test de charge |
| M18 | Paiement vers le mauvais compte connecté | T | Compte Stripe dérivé serveur du restaurant de la commande ; vérification au webhook | Intégration |

## Risques résiduels proposés (à valider)

- Pas de WAF applicatif avancé au pilote au-delà de celui du CDN.
- Chiffrement applicatif limité aux champs listés dans `data-model.md`.
