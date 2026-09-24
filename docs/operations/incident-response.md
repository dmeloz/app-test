# Réponse aux incidents

## Niveaux (objectifs proposés — proposition commerciale à valider, pas un SLA contractuel)

| Niveau | Exemple | Prise en charge visée |
|---|---|---|
| P1 | Plateforme ou paiements totalement indisponibles ; fuite de données ; fuite inter-tenant | 15–30 min pendant la couverture critique |
| P2 | Un restaurant ne reçoit plus les commandes ; commandes payées non injectées | < 1 h |
| P3 | Impression ou fonction secondaire défaillante | < 4 h ouvrées |
| P4 | Contenu, demande courante | 1 jour ouvré |

Couverture critique proposée au pilote : pendant les services (11 h–14 h, 18 h–22 h) par le porteur.

## Procédure

1. **Détecter** (alerte, restaurant, client) → ouvrir un `support_case` avec niveau.
2. **Contenir** : pause des commandes du restaurant concerné, désactivation d'une intégration, rotation
   d'un secret, blocage d'un compte.
3. **Communiquer** : restaurant(s) concerné(s) ; page de statut (après pilote).
4. **Corriger** : correctif via le cycle de lot accéléré (spec courte → Sonnet → audit Opus → humain).
5. **Réconcilier** : commandes, paiements, remboursements touchés.
6. **Post-mortem** sans blâme sous 5 jours ouvrés (`docs/operations/postmortems/`).

## Violation de données personnelles (à valider par juriste)

Qualifier (données, personnes, tenants) → contenir → consigner → évaluer le risque → informer le
responsable du traitement (restaurant) sans délai → le responsable notifie le PFPDT « dès que possible »
si risque élevé (LPD ; RGPD : 72 h le cas échéant) → informer les personnes si nécessaire → post-mortem.

## Incident allergène

Arrêter la remise, rembourser intégralement, ouvrir un P1, conserver les preuves (version du menu,
déclaration validée, commande), informer le restaurant ; aucune modification des déclarations sans trace.
