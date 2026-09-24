# ADR 0005 — Paiement : Stripe Connect, direct charges, sans commission

- **Statut** : Proposé — **vérification humaine requise avant acceptation (gate L08)** · **Date** : 2026-09-24

## Contexte
Le restaurant doit être le vendeur légal et encaisser sur son propre compte ; la plateforme ne prend
aucune commission ; TWINT est indispensable en Suisse.

## Options
1. Stripe Connect **direct charges** sur compte connecté du restaurant, sans `application_fee`.
2. Destination charges / separate charges and transfers (la plateforme encaisse puis reverse).
3. Chaque restaurant fournit ses propres clés API Stripe (hors Connect).
4. Autre PSP suisse (ex. Datatrans, Payrexx, Wallee) via le même port.

## Décision proposée
Option 1, **dès le pilote** (et non en phase 3 comme indiqué dans la feuille de route du prompt maître) :
encaisser sur le compte plateforme ferait de fait de la plateforme l'encaisseur, contraire au modèle légal.
Stripe Checkout hébergé au pilote (périmètre PCI réduit). Port `PaymentProvider` pour permettre l'option 4.

## À vérifier (documentation Stripe + compte test CH), résultat à consigner ici
- [ ] TWINT disponible pour des comptes connectés suisses en direct charges, via Checkout.
- [ ] Type de compte connecté / « controller properties » adapté (qui paie les frais, qui porte les
      pertes et soldes négatifs, qui gère les litiges, dashboard du restaurant).
- [ ] Connexion d'un compte Stripe existant du restaurant possible avec ce type.
- [ ] Remboursements et litiges gérés sur le compte connecté.

## Conséquences
+ Restaurant merchant of record, fonds directs, remboursements et litiges chez lui.
− Dépendance à Connect ; onboarding KYC du restaurant par Stripe.

## Risques
Indisponibilité de TWINT en Connect direct → option 4 via le port (autre PSP), à évaluer.
Option 3 écartée : stockage de clés secrètes de tiers, risque élevé.

## Réversibilité
Le domaine ne connaît que le port `PaymentProvider` ; changer de PSP = nouvel adaptateur + onboarding.
