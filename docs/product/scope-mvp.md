# Périmètre MVP recommandé

> Statut : **VALIDÉ par le porteur le 2026-09-24.**
> Distinction : **Pilote** = ce qui doit exister pour le premier restaurant réel (phase 2).
> **MVP commercial** = ce qui doit exister pour vendre à plusieurs restaurants suisses (phases 3–4).

## Arbitrage principal (recommandation Opus)

Le périmètre du prompt maître représente, pour un développeur seul assisté par Claude, nettement plus que
12–16 semaines (voir `roadmap.md`). Je recommande de **livrer un pilote resserré** et de reporter ce qui
n'est pas nécessaire au premier restaurant, **sans jamais réduire** tenancy, idempotence des paiements,
traçabilité, sauvegardes ou sécurité des accès. Le modèle de données reste complet dès le départ pour ne
pas créer d'impasse.

## Pilote — inclus

| Domaine | Inclus au pilote | Reporté |
|---|---|---|
| Tenancy | Tenant, restaurant, établissement (UI mono-établissement, modèle multi), RLS, tests d'isolation | UI multi-établissement complète |
| Site public | Sous-domaine plateforme, FR/EN, accueil, horaires, contact, pages légales, SEO de base | Domaine personnalisé (avant commercialisation) |
| Branding | 1 composition de page, tokens (couleurs, typo parmi une liste, rayons), logo, favicon, contrôle de contraste, versionnement du thème | Plusieurs compositions, prévisualisation avancée, blocs multiples |
| Menu | Menu publié + brouillon, catégories, produits, photos, variantes, groupes d'options min/max, suppléments, allergènes structurés, origines, contaminations croisées, rupture en un geste, disponibilité par jour/plage/canal, historique de publication | Menu programmé, import, duplication |
| Retrait | ASAP + créneau du jour, préparation minimale, quota par créneau, fermetures exceptionnelles, instructions | Pondération par produit |
| Livraison interne | Activable, zones par rayon **ou** code postal, minimum, frais, seuil de gratuité, adresse structurée + géocodage + confirmation, statuts | Polygones, prestataire externe |
| Checkout | Invité uniquement, validation serveur, devis serveur, CGV versionnées, consentement marketing séparé, reprise après redirection | Comptes clients |
| Paiement | Stripe Connect direct charges, carte + TWINT (sous réserve de vérification), webhooks, idempotence, remboursement total/partiel, rapprochement de base | Paiement au retrait (modélisé, désactivé) |
| Commandes | Numéro lisible + id non prédictible, machine à états opérationnelle + financière séparées, acceptation auto/manuelle, refus motivé, ajustement du délai, pause, alertes, détection « payée non injectée » | — |
| Back-office | Tableau de service temps réel, statuts, ruptures, horaires, zones, menu, remboursements par plafond, employés/rôles, statistiques essentielles, export CSV, journal d'audit | Promotions, état imprimantes |
| Impression | Ticket imprimable depuis le navigateur (mode initial) | Impression réseau ePOS |
| Notifications | E-mail transactionnel bilingue via outbox, journal d'envoi | Web Push, SMS |
| Auth personnel | OIDC géré, MFA/passkey obligatoire propriétaire/manager, RBAC | Accès support temporaire outillé (procédure manuelle auditée au pilote) |
| Fiscalité | Profil fiscal versionné, code de taxe par produit/frais, ventilation, snapshot, reçu (confirmation) | Facture fiscale PDF numérotée (après validation fiduciaire) |
| Exploitation | Logs JSON, métriques, alertes paiements/commandes non injectées, sauvegardes PITR testées | Page de statut publique |
| SaaS | Facturation manuelle hors produit pour le pilote | Abonnement Stripe Billing, impayés automatisés |

## MVP commercial (après pilote) — ajouts

Domaines personnalisés + TLS automatique · promotions (code, fixe/%, validité, minimum, limites) ·
Web Push personnel · SMS de secours · impression réseau · onboarding multi-restaurant outillé ·
facturation SaaS et procédure d'impayés · plusieurs thèmes · reçus/factures PDF validés · accès support
temporaire outillé · page de statut.

## Modélisé mais désactivé

Alcool (feature flag plateforme) · pourboire · paiement au retrait · précommande multi-jours · catering ·
produits au poids · QR code à table · bons cadeaux · commande de groupe · points de charge et stations.

## Hors périmètre

Application native · marketplace · microservices · Kubernetes · constructeur de pages libre · stocks de
matières premières · IA de prévision · optimisation de tournées · commande vocale · paiement partagé ·
cryptoactifs · programme de bons cadeaux complet · multi-pays simultané.

## Contradictions du prompt maître résolues par ce périmètre

Voir `open-decisions.md` § Contradictions : promotions (MVP vs phase 3), Stripe Connect (phase 2 vs 3),
notifications Web Push/SMS (MVP vs phase 3), états de commande mêlant opérationnel et financier.
