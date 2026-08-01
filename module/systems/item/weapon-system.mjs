/**
 * Préparation des armes
 */

export function prepareWeaponData(system){

  if(!system)
    return;

  /**
   * Conversion dégâts
   *
   * Exemple :
   * "1d6+2"
   *
   * pourra être utilisé directement
   * par Roll()
   */
  system.damageFormula = system.damage ?? "";

  /**
   * Etat équipement
   */
  if(system.equipped === undefined){

    system.equipped = true;

  }

}