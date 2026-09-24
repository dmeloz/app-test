# Flux de paiement

> Statut : PROPOSÉ (ADR 0005, 0006, 0008). **Faits à vérifier avant L08** : disponibilité de TWINT pour
> des comptes connectés suisses en direct charges ; type de compte connecté ; responsabilité des litiges
> et soldes négatifs ; frais. Ne pas implémenter définitivement avant vérification (gate L08).

## Modèle

- Chaque restaurant possède un compte Stripe **connecté** (existant ou créé via l'onboarding Connect).
- Les paiements des repas sont des **direct charges** créées sur le compte connecté (`Stripe-Account`),
  ce qui place le restaurant comme vendeur (merchant of record) selon la documentation Stripe.
- **Aucune `application_fee_amount`** : la plateforme ne prend pas de commission.
- Frais PSP, remboursements et litiges supportés par le compte du restaurant (à confirmer contractuellement).
- Abonnement SaaS : Stripe Billing sur le **compte plateforme**, client = le tenant ; flux totalement séparé.
- PCI : Stripe Checkout (hébergé) recommandé au pilote → périmètre visé SAQ A ; les pages restent
  sécurisées (CSP, intégrité des scripts).

## Séquence

```text
Client           Storefront          API                         PostgreSQL              Stripe (compte connecté)
  │ panier ───────▶│ POST /quotes ──────▶ recalcul complet ─────────▶ lecture menu/zone/slots
  │                │◀──────────────────── devis (total serveur)
  │ payer ────────▶│ POST /orders (Idempotency-Key)
  │                │                    ├─ BEGIN
  │                │                    ├─ re-vérifie menu, dispo, horaires, zone, capacité, promo
  │                │                    ├─ INSERT order (PENDING_PAYMENT / fin UNPAID) + snapshots
  │                │                    ├─ UPDATE time_slot SET reserved+1 WHERE reserved<max  (sinon SLOT_FULL)
  │                │                    ├─ INSERT slot_reservation (held, expires_at = now+15 min)
  │                │                    └─ COMMIT
  │                │ POST /orders/{id}/checkout ──▶ create Checkout Session (idempotency key = order id + tentative)
  │◀── redirection hébergée Stripe (carte / TWINT) ───────────────────────────────────────────────▶│
  │                                                                                                │
  │ retour navigateur ─▶ page « confirmation en cours » (poll GET /orders/{token})                  │
  │                                         ◀──────── webhook signé (checkout.session.completed /  │
  │                                                   payment_intent.succeeded, event.account)     │
  │                    POST /webhooks/stripe : vérif signature → INSERT webhook_event (unique id) → 200
  │                    worker : traite l'événement une seule fois
  │                                         ├─ BEGIN ; order fin_status PAID ; op PENDING_ACCEPTANCE (ou ACCEPTED si auto)
  │                                         ├─ slot_reservation confirmed ; order_transition ; outbox(email, SSE, print)
  │                                         └─ COMMIT
```

## Cas d'échec

| Situation | Comportement |
|---|---|
| Paiement échoué / session expirée | `fin_status=FAILED`, `op_status=PAYMENT_FAILED`, réservation relâchée, client peut réessayer (nouvelle tentative, même commande) |
| Réservation expirée mais paiement arrivé ensuite | Tenter de reconfirmer le créneau ; si plein, créneau suivant proposé au restaurant ou remboursement total automatique ; alerte |
| Webhook en double | Ignoré (contrainte unique `provider_event_id`) |
| Webhook non reçu | Rapprochement toutes les 5 min : sessions/PaymentIntents payés sans commande `PAID` → correction + alerte |
| Commande payée non injectée (> 60 s) | Alerte P2 + action opérateur |
| Refus restaurant | Remboursement total automatique (repas + frais + pourboire) |
| Restaurant en pause/suspendu pendant le paiement | Paiement refusé en amont (vérif au checkout) ; si déjà payé → remboursement total |
| Stripe indisponible | Commande non créée côté paiement ; message clair ; aucune commande `PENDING_PAYMENT` orpheline au-delà de l'expiration |

## Remboursements

- Création via API admin avec `Idempotency-Key` ; vérification du plafond du rôle et du cumul ≤ montant payé
  dans une transaction ; appel Stripe hors transaction ; statut suivi par webhook (`refund.updated`).
- Motifs normalisés : erreur client, rupture, refus restaurant, retard, non-livraison, produit manquant,
  produit incorrect, qualité, allergène, fraude présumée, doublon.
- Litiges : `charge.dispute.*` rattachés à la commande, échéance de preuve alertée.

## Rapprochement

- **Continu** (5 min) : paiements réussis ↔ commandes.
- **Quotidien** : commandes, paiements, remboursements, frais, versements (payouts) par compte connecté ;
  écarts listés au back-office et à l'opérateur.

## Machines à états (ADR 0006)

```text
Opérationnel : PENDING_PAYMENT → PENDING_ACCEPTANCE → ACCEPTED → IN_PREPARATION → READY
               → (COMPLETED | OUT_FOR_DELIVERY → (COMPLETED | DELIVERY_FAILED))
               PENDING_PAYMENT → PAYMENT_FAILED | CANCELED(expiré)
               PENDING_ACCEPTANCE → REJECTED | CANCELED ; ACCEPTED → CANCELED
Financier    : UNPAID → PAID → (PARTIALLY_REFUNDED ↔ REFUND_PENDING) → REFUNDED ; UNPAID → FAILED ;
               PAID → DISPUTED → (WON | LOST)
```
`DRAFT` du prompt est porté par le `cart` (pas de commande avant validation du checkout).
