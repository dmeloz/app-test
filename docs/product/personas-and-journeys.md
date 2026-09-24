# Personas et parcours

> Hypothèse de référence : restaurant indépendant lausannois (voir prompt maître). Ce ne sont pas des
> données statistiques ; à remplacer par l'observation d'un service réel dès qu'un pilote existe.

## Personas

| Persona | Contexte | Besoins clés | Irritants à éviter |
|---|---|---|---|
| **Client invité (Léa, 29 ans)** | Mobile, pause de midi, 10 minutes | Voir délai et frais d'emblée, payer TWINT, suivre | Compte obligatoire, frais surprise, créneau irréaliste |
| **Client livraison (Marc, 45 ans)** | Soir, famille, appartement avec interphone | Adresse précise, instructions, heure fiable | Livreur perdu, commande froide |
| **Client allergique (Sofia)** | Allergie arachide | Allergènes clairs avant ajout au panier | Information absente ou ambiguë |
| **Propriétaire (Karim)** | Gère le restaurant, peu de temps, non technique | Encaissement direct, pas de commission, contrôle des prix et remboursements | Configuration longue, surprises de coût |
| **Manager de service (Julie)** | En cuisine/au comptoir pendant le rush | Voir et accepter vite, ajuster délais, mettre en rupture, pauser | Alertes manquées, trop de clics |
| **Employé (Tom)** | Prépare, emballe, remet | Liste claire, statut en un geste, ticket imprimé | Interface complexe |
| **Livreur interne (Ana)** | Employé du restaurant | Adresse, téléphone, instructions, marquer livré/échec | Informations incomplètes |
| **Opérateur plateforme (porteur)** | Onboarding, support, surveillance | Voir la santé de chaque restaurant, accès support audité | Accès aux données sans trace |

## Parcours critiques

### P1 — Commande invité en retrait
1. Arrive sur le site (lien Instagram, Google) → voit ouvert/fermé, délai estimé, retrait/livraison.
2. Choisit « Retrait » → menu avec disponibilités réelles et allergènes accessibles.
3. Ajoute un produit avec variante et options (min/max respectés, suppléments non présélectionnés).
4. Panier fixe en bas ; total serveur toujours visible.
5. Choisit ASAP ou un créneau avec capacité réelle.
6. Saisit prénom, e-mail, téléphone (autofill) ; accepte les CGV ; consentement marketing séparé.
7. Paie (TWINT/carte) sur interface Stripe ; retour → page « en attente de confirmation » jusqu'au webhook.
8. Reçoit e-mail de confirmation + lien de suivi ; voit Acceptée → Prête.

### P2 — Commande en livraison
Comme P1 avec : saisie d'adresse autocomplétée et modifiable, confirmation cartographique si précision
faible, vérification de zone, minimum et frais affichés avant le checkout, instructions de livraison.

### P3 — Service côté restaurant
Nouvelle commande → alerte sonore et visuelle → accepter (ou auto) / refuser avec motif → ajuster le délai →
imprimer → En préparation → Prête → (Remise | En livraison → Livrée | Échec) . Pause des commandes en un geste.
Rupture d'un produit en un geste.

### P4 — Refus et remboursement
Refus → remboursement total automatique → e-mail client → suivi du remboursement jusqu'à l'état final.
Remboursement partiel par manager dans son plafond ; au-delà, approbation propriétaire avec réauthentification.

### P5 — Onboarding accompagné (opérateur)
Voir `docs/operations/restaurant-runbook.md` (18 étapes). Aucun passage en production sans paiement
fonctionnel, commande de bout en bout, remboursement de test, informations légales, menu validé.

### P6 — Incident : paiement confirmé mais commande non visible
Le rapprochement détecte l'écart → alerte opérateur → commande injectée ou remboursée → trace d'audit.
