# User stories (pilote)

Format : identifiant · en tant que … je veux … afin de … · priorité (M = must pilote, S = should, C = après pilote).
Les critères d'acceptation correspondants sont dans `acceptance-criteria.md`.

## Client final
- **US-C01** (M) En tant que client, je veux voir si le restaurant est ouvert, le délai et les canaux disponibles dès l'arrivée, afin de décider vite.
- **US-C02** (M) … choisir retrait ou livraison avant de parcourir le menu, afin de voir les bons prix, délais et disponibilités.
- **US-C03** (M) … consulter le menu avec photos, variantes, options, allergènes et origines, afin de choisir en confiance.
- **US-C04** (M) … composer un produit avec options obligatoires/facultatives et voir le prix mis à jour par le serveur.
- **US-C05** (M) … voir un panier persistant et le total toujours visible, afin d'éviter les surprises.
- **US-C06** (M) … choisir « dès que possible » ou un créneau réellement disponible.
- **US-C07** (M) … saisir et confirmer une adresse de livraison, avec instructions, et savoir immédiatement si je suis dans la zone, le minimum et les frais.
- **US-C08** (M) … commander sans créer de compte.
- **US-C09** (M) … payer par TWINT ou carte et retrouver ma commande si la redirection ou le réseau échoue.
- **US-C10** (M) … recevoir une confirmation immédiate par e-mail et suivre l'état de ma commande via un lien.
- **US-C11** (M) … être informé et remboursé automatiquement si le restaurant refuse ma commande.
- **US-C12** (M) … utiliser le site en français ou en anglais.
- **US-C13** (S) … consulter le dernier menu hors ligne avec un avertissement clair.
- **US-C14** (M) … donner ou refuser séparément mon consentement marketing.
- **US-C15** (C) … appliquer un code promotionnel.
- **US-C16** (C) … créer un compte facultatif et retrouver mes adresses.

## Personnel du restaurant
- **US-R01** (M) En tant que manager, je veux voir les nouvelles commandes en temps réel avec alerte sonore et visuelle.
- **US-R02** (M) … accepter, refuser avec motif, ou laisser l'acceptation automatique selon la configuration.
- **US-R03** (M) … ajuster le délai annoncé d'une commande et le délai global.
- **US-R04** (M) … faire avancer une commande dans ses statuts sans pouvoir faire de transition illégale.
- **US-R05** (M) … mettre un produit ou une option en rupture en un geste.
- **US-R06** (M) … mettre en pause immédiatement les nouvelles commandes.
- **US-R07** (M) … imprimer ou réimprimer un ticket de commande.
- **US-R08** (M) … rembourser totalement ou partiellement dans la limite de mon rôle.
- **US-R09** (M) En tant que propriétaire, je veux gérer menus, prix, variantes, options, allergènes et origines, avec brouillon et publication.
- **US-R10** (M) … configurer horaires, fermetures exceptionnelles, préparation, créneaux et capacités.
- **US-R11** (M) … activer/désactiver retrait et livraison, et configurer zones, minimum, frais, gratuité.
- **US-R12** (M) … gérer les employés, leurs rôles, et révoquer un accès immédiatement.
- **US-R13** (M) … configurer logo, couleurs, typographie et contenus, avec contrôle de contraste.
- **US-R14** (M) … consulter statistiques essentielles et exporter les commandes en CSV.
- **US-R15** (M) … consulter le journal d'audit.
- **US-R16** (M) … configurer le profil fiscal et les codes de taxe, validés par ma fiduciaire.
- **US-R17** (C) … créer des promotions simples.

## Opérateur plateforme
- **US-P01** (M) En tant qu'opérateur, je veux créer un tenant, un restaurant et un établissement et suivre l'état d'onboarding.
- **US-P02** (M) … connecter le compte Stripe du restaurant via l'onboarding Connect.
- **US-P03** (M) … être alerté si une commande payée n'est pas injectée ou si les paiements échouent anormalement.
- **US-P04** (M) … accéder temporairement aux données d'un tenant pour le support, de façon explicite, limitée et auditée.
- **US-P05** (M) … exporter toutes les données d'un tenant en formats ouverts.
- **US-P06** (C) … gérer l'abonnement SaaS et les impayés.
