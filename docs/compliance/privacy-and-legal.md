# Protection des données et cadre légal

> **Ceci n'est pas un avis juridique.** Cadrage technique à faire valider par un juriste (LPD, droit de
> la consommation, CGV) et une fiduciaire (TVA, pièces comptables, pourboires). Chaque point marqué
> « à valider » est une hypothèse.

## Rôles (à valider)

| Traitement | Responsable | Sous-traitant |
|---|---|---|
| Commandes, clients, consentements d'un restaurant | Restaurant | Plateforme (DPA obligatoire) |
| Comptes du personnel, sécurité, facturation SaaS | Plateforme | Hébergeur, OIDC, Stripe (plateforme) |
| Paiement des repas | Restaurant (et Stripe selon ses propres conditions) | — |

## Suisse — LPD (exigences à couvrir)

Protection des données dès la conception et par défaut · politique de confidentialité par restaurant
(modèle fourni) et de la plateforme · registre des traitements · inventaire des sous-traitants (avec
pays d'hébergement vérifié) · contrats de sous-traitance · droits d'accès, rectification, export,
opposition, suppression (`data_subject_request`) · durées de conservation · procédure de violation
de données (`docs/operations/incident-response.md`) · analyse des transferts internationaux · gestion
des cookies (aucun traceur non nécessaire au pilote).

## Commerce en ligne (SECO — à valider)

Identité et adresse du vendeur (le restaurant) sur le site · étapes de conclusion du contrat expliquées ·
correction des erreurs avant envoi (récapitulatif modifiable) · confirmation électronique immédiate ·
prix total effectivement payé en CHF, suppléments non optionnels inclus, optionnels séparés.

## Denrées alimentaires

Allergènes structurés (14 allergènes réglementaires) visibles avant commande · origines requises
(viande, poisson) · avertissement contaminations croisées · historique des déclarations · validation
humaine par le restaurant · interdiction de générer une information allergène non confirmée.

## Politique d'annulation (proposée, configurable, à valider)

Reprise de la politique progressive du prompt maître (`docs/reference/prompt-maitre.md` § Annulation) :
avant paiement libre ; payé non accepté → remboursement total ; accepté avant préparation → au choix du
restaurant, total recommandé ; en préparation → pas de garantie ; refus/inexécution du restaurant →
remboursement total ; allergène suspect → arrêt, remboursement intégral, incident critique.

## TVA (à valider par fiduciaire)

Taux publiés (ESTV) : normal 8,1 %, réduit 2,6 %, hébergement 3,8 % — **à re-vérifier à chaque mise en
production**. Denrées non alcoolisées à l'emporter/livrées : taux réduit possible ; boissons alcoolisées
et restauration sur place : taux normal. Le logiciel n'en déduit rien automatiquement : profil fiscal
versionné par établissement, code de taxe par produit et frais, validé par la fiduciaire.

## Alcool

Modélisé, **désactivé** (feature flag plateforme après contrôle documentaire de la licence). Vaud :
autorisation requise ; interdit aux moins de 16 ans, distillés aux moins de 18 ans. Lausanne : vente à
l'emporter et livraison de bière et distillés interdites entre 20 h et 6 h (exception indiquée pour vin et
cidre) — **à re-vérifier** ; règles évaluées à l'heure de remise prévue.

## Durées de conservation proposées (à valider)

| Données | Durée proposée | Base |
|---|---|---|
| Commandes, lignes, paiements, remboursements (pièces comptables du restaurant) | 10 ans, puis suppression ; données client anonymisées après 3 ans | Obligations comptables (à valider) |
| Profil client, adresses | 3 ans après dernière commande | Minimisation |
| Consentements (preuve) | Durée de la relation + 3 ans | Preuve |
| Paniers non convertis | 7 jours | Minimisation |
| Payload brut des webhooks | 90 jours | Débogage, litiges |
| Logs techniques | 30 jours | Sécurité |
| Journal d'audit | 2 ans | Sécurité, preuve |
| Journal d'envoi des notifications | 1 an | Support |
| Sauvegardes | PITR 35 j, mensuelles 12 mois | Continuité |

## Union européenne (préparation seulement)

RGPD, consentement, droits, minimisation, registre, notification des violations, transferts, TVA et
règles de consommation par pays (droit de rétractation et ses exceptions pour denrées périssables à
analyser par pays). Aucun pays n'est activé sans revue juridique, fiscale et opérationnelle locale.

## Registre des sous-traitants (à compléter)

| Service | Fournisseur | Données | Région vérifiée |
|---|---|---|---|
| Hébergement | à choisir (ADR 0012) | toutes | non vérifiée |
| Paiement | Stripe | paiement, e-mail client | non vérifiée |
| OIDC personnel | à choisir (ADR 0009) | personnel | non vérifiée |
| E-mail transactionnel | à choisir | e-mail, contenu de commande | non vérifiée |
| Géocodage | à choisir | adresse | non vérifiée |
