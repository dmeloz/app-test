# Règles de sécurité (toujours chargées)

- Ne jamais lire, afficher, copier ou commiter un secret (`.env*`, clés, tokens). Utiliser `.env.example`.
- Ne jamais faire confiance au client : tenant, prix, totaux, rôles, statuts sont déterminés serveur.
- Autorisation vérifiée au niveau objet sur chaque accès (l'objet appartient-il au tenant et le rôle
  a-t-il la permission ?).
- Webhooks : signature vérifiée sur le corps brut, fenêtre temporelle, déduplication par identifiant
  d'événement avant tout traitement.
- Tokens publics (suivi de commande) : ≥ 128 bits d'entropie, expirables, rate-limités.
- Cookies de session `Secure`, `HttpOnly`, `SameSite=Lax` (ou `Strict` pour le back-office) ; protection
  CSRF sur les mutations par cookie.
- CSP restrictive ; aucun script tiers hors Stripe sur les pages de paiement.
- Contenus de marque (HTML, CSS, SVG, URLs) : assainis ; pas de CSS/JS arbitraire fourni par un tenant.
- Toute URL fournie par un utilisateur (médias, webhooks sortants) : protection SSRF (liste d'autorisation,
  refus des IP privées).
- MFA/passkey obligatoire pour propriétaire et manager ; réauthentification pour remboursement important,
  export massif, modification bancaire, changement de rôle critique.
- Audit (`AuditLog`) de toute modification sensible : auteur, tenant, action, cible, avant/après minimal,
  horodatage, correlationId.
- Signaler tout constat de sécurité même hors périmètre du lot.
