/**
 * Préparation commune des Items
 *
 * Tous les Items passent ici avant
 * leur logique spécifique.
 */

import { prepareWeaponData } from "./weapon-system.mjs";
import { prepareArmorData } from "./armor-system.mjs";
import { prepareEffectData } from "./effect-system.mjs";



export function prepareItemData(item){


  const system = item.system;


  if(!system)
    return;



  /**
   * Préparation des effets communs
   */
  prepareEffectData(
    system
  );



  switch(item.type){


    case "arme":

      prepareWeaponData(
        system
      );

      break;



    case "armure":

      prepareArmorData(
        system
      );

      break;


  }


  return system;

}