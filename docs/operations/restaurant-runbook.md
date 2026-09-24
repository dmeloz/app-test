# Runbook restaurant

## Onboarding accompagné (18 étapes — suivi dans `onboarding_step`)

| # | Étape | Preuve attendue | Responsable |
|---|---|---|---|
| 1 | Qualification (canaux, volume, matériel) | fiche de qualification | opérateur |
| 2 | Entité juridique, licences, signataire | extrait RC, licences | opérateur |
| 3 | Création tenant / restaurant / établissement | ids créés | opérateur |
| 4 | Contrat SaaS + DPA signés | PDF signés | propriétaire |
| 5 | Compte Stripe connecté (création ou connexion) | compte `charges_enabled` | propriétaire |
| 6 | Domaine (sous-domaine au pilote ; perso + preuve DNS ensuite) | domaine vérifié | opérateur |
| 7 | Import ou saisie du menu | version brouillon | opérateur + restaurant |
| 8 | Validation prix, TVA, allergènes, origines | validation signée restaurant + fiduciaire | propriétaire |
| 9 | Thème, contenus, e-mails | thème publié, contraste OK | opérateur |
| 10 | Horaires, fermetures, préparation, créneaux, capacités | configuration | manager |
| 11 | Zones, frais, règles de livraison | zones actives | manager |
| 12 | Comptes employés + MFA | MFA actif owner/manager | propriétaire |
| 13 | Tablette, son, impression | test d'alerte et de ticket | opérateur |
| 14 | Tests : commande, échec, refus, remboursement | commandes de test + remboursement | opérateur + manager |
| 15 | Formation propriétaire et équipe (< 1 h visée) | liste de présence | opérateur |
| 16 | Checklist de mise en ligne signée | checklist | propriétaire |
| 17 | Ouverture contrôlée, surveillance renforcée | premier service suivi | opérateur |
| 18 | Revues J+7 et J+30 | comptes rendus | opérateur + propriétaire |

**Blocage** : aucun passage en production sans paiement fonctionnel, commande de bout en bout,
remboursement de test, informations légales, menu validé et procédure de secours.

## Pendant le service

- Tablette branchée, son activé, écran « Service » ouvert ; alerte sonore testée à l'ouverture.
- Rush : augmenter le délai global ou mettre en pause ; mettre les produits en rupture en un geste.
- Commande non vue en 2 min : l'alerte persiste (répétition sonore) ; (après pilote : SMS de secours).

## Mode dégradé

| Panne | Action restaurant | Action plateforme |
|---|---|---|
| Imprimante | Lire les commandes à l'écran ; impression navigateur | — |
| Tablette / réseau du restaurant | Mettre en pause depuis un téléphone ; sinon appeler le support | Pause à distance sur demande |
| Paiements indisponibles | Pause des commandes | Bannière, P1 |
| Plateforme indisponible | Commandes par téléphone | P1, page de statut |
| E-mails non envoyés | Informer le client au retrait | Rejeu depuis l'outbox |
