// provisoire — remplacé par packages/contracts au L04
//
// M2 (audit-1.md) : frais de livraison et minimum de commande fictifs, canal livraison uniquement
// (spec P01 §2.3 « frais et minimum affichés »). Entiers en centimes (règle n°2 du CLAUDE.md),
// jamais calculés côté navigateur pour de vrai (aucun serveur ici — maquette, spec §2 « Exclu »).
export const DELIVERY_FEE_CENTS = 350;
export const MINIMUM_ORDER_FOR_DELIVERY_CENTS = 2000;
