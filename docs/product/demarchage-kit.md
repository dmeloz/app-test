# Kit de démarchage des restaurants pilotes

> Objectif : trouver **un restaurant pilote** et valider la volonté de payer, pas vendre à tout prix.
> Les prix sont des **hypothèses à tester** (voir `docs/finance/cost-model.md`), jamais des engagements.

## 1. Cibles (à remplir par le porteur)

Restaurants indépendants de Lausanne, 20–50 références, retrait et/ou livraison, idéalement déjà sur une
plateforme de livraison (douleur de la commission visible).

| # | Restaurant | Type | Déjà sur une plateforme ? | Contact | Date | Résultat |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| … | | | | | | |
| 10 | | | | | | |

## 2. Message d'approche (à adapter)

> Bonjour, je développe à Lausanne un outil qui permet aux restaurants d'avoir leur propre site de commande
> en ligne — à leur nom, payé par TWINT ou carte directement sur leur compte — **sans commission** sur les
> commandes. Je cherche à comprendre comment vous gérez les commandes aujourd'hui. Auriez-vous 20 minutes,
> en dehors du service, pour un échange ? Je ne vends rien lors de ce rendez-vous.

## 3. Guide d'entretien — 20 minutes

**Écouter d'abord (12 min), montrer ensuite (5 min), conclure (3 min).**

1. Comment recevez-vous les commandes à emporter / en livraison aujourd'hui ? (téléphone, plateformes, site)
2. Combien par jour, et à quels moments ? Qu'est-ce qui se passe pendant le rush ?
3. Quelles plateformes utilisez-vous ? Que vous coûtent-elles (commission, abonnement) ? Qu'aimez-vous / détestez-vous ?
4. Qui prend les commandes, sur quel appareil ? Imprimez-vous des tickets ?
5. Livrez-vous vous-mêmes ? Sur quelle zone ?
6. Comment gérez-vous les ruptures, les allergènes, les horaires spéciaux ?
7. Avez-vous déjà un site, un nom de domaine, un compte TWINT/Stripe ?
8. Qu'est-ce qui vous ferait changer de solution ? Qu'est-ce qui vous en empêcherait ?
9. *(Après la démo)* Qu'est-ce qui manque pour que vous l'utilisiez demain ?
10. *(Conclusion)* Si c'était prêt, seriez-vous d'accord d'être restaurant pilote pendant 4 semaines ?
    À quel prix mensuel cela vous paraîtrait-il juste ? (ne pas proposer de prix avant sa réponse)

Noter les réponses **mot pour mot** ; les synthétiser ensuite dans `docs/product/personas-and-journeys.md`.

## 4. Script de démonstration — 3 minutes (sur téléphone)

1. **(30 s)** « Voici votre site, à votre nom. » Accueil : ouvert, délai, Retrait / Livraison.
2. **(60 s)** Menu : un plat avec option obligatoire et un supplément ; montrer les allergènes avant l'ajout,
   un produit en rupture ; le total toujours visible.
3. **(45 s)** Panier → créneau (montrer un créneau complet) → paiement simulé TWINT → suivi.
4. **(45 s)** Côté cuisine (back-office) : la commande arrive avec alerte, Accepter → Prête ; Pause en un
   geste pendant le rush ; rupture en un geste.
5. Toujours préciser : **« C'est une démonstration, aucune commande n'est réelle. »**

## 5. Arguments (à vérifier avant de les affirmer)

- Pas de commission par commande : abonnement fixe.
- L'argent arrive directement sur le compte du restaurant (Stripe Connect — **à confirmer** avec TWINT, gate L08).
- Les clients et leurs consentements appartiennent au restaurant.
- Pensé pour le service : peu de clics, pause et rupture en un geste.

**Ne jamais promettre** : une date de livraison, une intégration de caisse, un prix définitif, une
conformité juridique non validée.
