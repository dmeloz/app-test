---
paths:
  - "apps/api/src/modules/payment/**/*"
  - "apps/api/src/modules/refund/**/*"
  - "apps/api/src/modules/checkout/**/*"
  - "apps/api/src/modules/pricing/**/*"
  - "apps/api/src/modules/promotion/**/*"
  - "apps/api/src/modules/subscription/**/*"
  - "packages/domain/src/pricing/**/*"
  - "packages/domain/src/tax/**/*"
---

# Règles paiements, prix et taxes

- Stripe Connect **direct charges** sur le compte connecté du restaurant (merchant of record) ; aucune
  `application_fee` sur les repas (pas de commission). Abonnement SaaS facturé sur le compte plateforme,
  totalement séparé (ADR 0005).
- Flux : recalcul serveur → vérifs (menu, dispo, horaires, promo, zone, capacité) → commande
  `PENDING_PAYMENT` → réservation de créneau → PaymentIntent/Checkout Session avec clé d'idempotence →
  confirmation **uniquement par webhook signé** → déduplication → `PAID`.
- Le retour navigateur n'est jamais la source de vérité.
- Chaque paiement/remboursement enregistre : montant, devise, identifiant PSP, compte connecté, état,
  auteur, motif, horodatages.
- Remboursements : plafond par rôle ; au-delà, approbation propriétaire ; suivi jusqu'à l'état final
  par webhook ; remboursement total automatique si la commande est refusée.
- État opérationnel et état financier de la commande sont séparés (ADR 0006).
- Rapprochement : tâche détectant paiement sans commande exploitable et commande payée non injectée ;
  rapprochement quotidien commandes/paiements/remboursements/frais/versements.
- Taxes : profil fiscal versionné par établissement et date d'effet ; code de taxe par produit et frais ;
  règles par canal ; snapshot des taux dans la commande ; aucun taux codé en dur comme vérité.
- Arrondis : règle unique documentée et testée (arrondi CHF 0.05 pour l'affichage/encaissement si
  retenu — à valider par fiduciaire).
- Toute modification de ce périmètre = lot critique : audit Opus + validation humaine obligatoires.
