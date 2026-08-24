/**
 * Equipment System
 *
 * Gestion des équipements Actor.
 *
 * Les équipements ne calculent aucune statistique.
 * Ils fournissent uniquement des données.
 */

/**
 * Retourne les équipements actifs
 *
 * @param {Actor} actor
 */
export function getEquippedItems(actor){

  if(!actor)
    return [];

  return actor.items?.filter(
    item =>
      item.system?.equipped === true
  )
  ?? [];

}


/**
 * Armes équipées
 */
export function getEquippedWeapons(actor){

  return getEquippedItems(actor)
    .filter(
      item =>
        item.type === "arme"
    );

}


/**
 * Armures équipées
 */
export function getEquippedArmor(actor){

  return getEquippedItems(actor)
    .filter(
      item =>
        item.type === "armure"
    );

}