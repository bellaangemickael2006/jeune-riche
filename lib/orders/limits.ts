// Limites d'une commande, partagées par le panier (navigateur) et l'API de
// commande (serveur), pour qu'un vrai client ne puisse jamais construire un
// panier que le serveur refuserait.
export const MAX_LINE_QUANTITY = 50;
export const MAX_CART_LINES = 30;
