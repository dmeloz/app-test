# Critères d'acceptation (pilote)

Chaque lot reprend et précise ces critères dans sa spec (`AC-LXX-nn`). Un critère est **vérifiable** :
données d'entrée, action, résultat attendu, test associé.

## Transverses (s'appliquent à tous les lots)

- **AC-T01 Isolation** : pour toute ressource, un utilisateur du tenant B ne peut ni lire, ni modifier, ni
  supprimer une donnée du tenant A, via l'API (404) et en SQL avec `app_runtime` (0 ligne). Test automatisé.
- **AC-T02 Tenant serveur** : un `tenantId` dans un corps ou une query n'a aucun effet (ignoré ou 400).
- **AC-T03 Montants** : tout montant stocké est un entier + devise ISO ; aucun total client n'est utilisé.
- **AC-T04 Audit** : toute mutation admin produit une entrée `audit_log` (auteur, tenant, action, cible, correlationId).
- **AC-T05 Logs** : aucun e-mail, téléphone, adresse, token ou secret dans les logs (test sur échantillon).
- **AC-T06 i18n** : tout texte visible existe en FR et EN.
- **AC-T07 Accessibilité** : pages critiques sans violation axe « serious/critical » ; cibles ≥ 24×24 px.

## Menu et disponibilité
- **AC-M01** Un produit en rupture n'est pas commandable ; s'il l'est devenu pendant le panier, le devis le signale et propose de retirer la ligne.
- **AC-M02** Un groupe d'options min=1 max=2 refuse 0 et 3 sélections côté serveur (422 avec code précis).
- **AC-M03** Les suppléments payants ne sont jamais présélectionnés.
- **AC-M04** Les allergènes d'un produit sont visibles avant l'ajout au panier ; seules les déclarations validées par le restaurant sont publiées.
- **AC-M05** La publication d'un menu crée une `menu_version` immuable ; les commandes référencent la version.

## Créneaux et capacité
- **AC-S01** Un créneau dont le quota est atteint n'est plus proposé ; deux commandes concurrentes pour la dernière place : une seule réussit (test de concurrence).
- **AC-S02** Une réservation non payée expire après N minutes (configurable) et libère la place.
- **AC-S03** Fermeture exceptionnelle : aucun créneau proposé sur la période ; commande ASAP refusée.
- **AC-S04** Le premier créneau respecte le délai minimum de préparation et le tampon avant fermeture (fuseau Europe/Zurich, y compris jours de changement d'heure).

## Livraison
- **AC-D01** Livraison désactivée → le canal n'apparaît nulle part et l'API refuse une commande livraison.
- **AC-D02** Adresse hors zone → refus explicite avant paiement ; en limite de zone → comportement documenté (inclusif) et testé.
- **AC-D03** Minimum, frais et seuil de gratuité appliqués par le serveur et affichés avant le checkout.
- **AC-D04** La commande conserve le snapshot de la zone, des frais et de l'adresse géocodée.

## Checkout et paiement
- **AC-P01** Le devis serveur est la seule source du total ; un prix modifié entre panier et paiement est signalé, jamais appliqué silencieusement.
- **AC-P02** Créer deux fois une commande avec la même `Idempotency-Key` renvoie la même commande.
- **AC-P03** La commande passe à « payée » uniquement après webhook signé valide ; le retour navigateur seul ne change rien.
- **AC-P04** Un webhook rejoué (même event id) n'a aucun effet supplémentaire.
- **AC-P05** Un webhook à signature invalide ou trop ancien est rejeté (400) et journalisé.
- **AC-P06** Paiement échoué → commande `PAYMENT_FAILED`, créneau libéré, client informé.
- **AC-P07** Retour TWINT après fermeture de l'onglet : le lien de suivi affiche l'état correct.
- **AC-P08** Le paiement est créé sur le compte connecté du restaurant (direct charge) sans commission plateforme.
- **AC-P09** Une commande payée non injectée dans le flux opérationnel sous 60 s déclenche une alerte.

## Commandes et back-office
- **AC-O01** Toute transition hors de la table de transitions autorisées est refusée (409) et testée exhaustivement.
- **AC-O02** Chaque transition est historisée (auteur, horodatage, motif).
- **AC-O03** Nouvelle commande visible au back-office en < 10 s après le webhook (mesuré en e2e).
- **AC-O04** Refus → remboursement total automatique incluant frais de livraison.
- **AC-O05** Remboursement au-delà du plafond du rôle → exige approbation propriétaire + réauthentification.
- **AC-O06** Pause active → le site public indique la pause et l'API refuse les nouvelles commandes.
- **AC-O07** Un employé révoqué perd l'accès immédiatement (session invalidée).

## Parcours e2e critiques (Playwright)
Commande invité retrait · commande livraison · paiement réussi · paiement échoué · retour TWINT ·
refus et remboursement · rupture pendant le panier · créneau devenu complet · fermeture exceptionnelle ·
utilisateur sans permission · restaurant A → B · rejeu de webhook · panne temporaire d'un fournisseur (e-mail).
