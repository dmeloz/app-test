# Vision produit

## En une phrase

Donner à chaque restaurant son propre site de commande en ligne, à son image et sous son nom, pour un
abonnement fixe et sans commission, afin de réduire sa dépendance aux plateformes de livraison.

## Problème

- Les plateformes prélèvent une commission par commande et gardent la relation client.
- Un site sur mesure coûte cher à créer, à sécuriser et à maintenir pour un restaurant indépendant.
- Les outils génériques gèrent mal la réalité d'un service : créneaux saturés, ruptures, allergènes,
  livraison interne, remboursements, TVA suisse selon le canal.

## Proposition de valeur

| Pour le restaurant | Pour le client final |
|---|---|
| Site et e-mails à sa marque, sur son domaine | Commande rapide sans compte, sur mobile |
| Aucune commission, abonnement fixe prévisible | Prix total clair avant paiement (CHF) |
| Encaissement direct sur son propre compte Stripe (TWINT, carte) | TWINT et carte |
| Données clients et consentements sous son contrôle | Créneau réaliste, suivi de commande |
| Back-office utilisable en plein service | Informations allergènes avant commande |

## Principes

- Le restaurant est le vendeur légal ; la plateforme est un fournisseur de technologie.
- Une seule base de code pour tous les restaurants ; la personnalisation passe par la configuration.
- Sécurité des paiements, isolation entre restaurants et traçabilité ne sont jamais sacrifiées au délai.
- Simple d'abord, sans impasse volontaire (multi-établissement, EUR, UE, auto-hébergement préparés).

## Ce que le produit n'est pas (au MVP)

Une marketplace publique, une application native, une solution de caisse, un logiciel de flotte de
livreurs, un moteur de fidélité, un constructeur de pages libre.

## Réussite du pilote (objectifs internes, pas des garanties)

100 commandes réelles ou 4 semaines · zéro doublon de commande payée · zéro fuite inter-tenant ·
95 % des commandes payées visibles au restaurant en < 10 s · personnel autonome après < 1 h de formation ·
restaurateur confirmant par écrit sa volonté de payer le tarif proposé.
