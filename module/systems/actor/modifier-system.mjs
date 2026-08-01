/**
 * Modifier System
 *
 * Gestion centralisée des bonus/malus.
 *
 * Les modifiers ne modifient jamais
 * directement les valeurs originales.
 *
 * Ils alimentent les valeurs calculées.
 */
export class ModifierSystem {

  /**
   * Récupère tous les modifiers actifs
   */
  static collect(actor){

    const modifiers = [];

    if(!actor)
      return modifiers;

    /*
     * Items
     */
    for(const item of actor.items ?? []){

      if(!item.system)
        continue;

      /*
       * Gestion équipement
       */
      if(
        ["arme","armure","sac"]
        .includes(item.type)
      ){

        if(item.system.equipped !== true)
          continue;

      }

      if(
        !Array.isArray(
          item.system.modifiers
        )
      )
        continue;

      for(const modifier of item.system.modifiers){

        if(
          modifier.enabled === false
        )
          continue;

        modifiers.push({

          ...modifier,

          source:{
            id:item.id,
            name:item.name,
            type:item.type
          }

        });

      }

    }

    /*
     * Active Effects
     */
    for(const effect of actor.effects ?? []){

      const effects = effect.flags?.shinzo?.modifiers;

      if(!Array.isArray(effects))
        continue;

      for(const modifier of effects){

        if(modifier.enabled === false)
          continue;

        modifiers.push({

          ...modifier,

          source:{
            id:effect.id,
            name:effect.name,
            type:"effect"
          }

        });

      }

    }

    return modifiers;

  }


  /**
   * Applique les modifiers
   *
   * IMPORTANT :
   * target pointe vers une donnée calculée
   */
  static apply(
    data,
    modifiers=[]
  ){

    if(!data)
      return;

    const ordered =
      [...modifiers]
      .sort(
        (a,b)=>
        (a.priority ?? 0)
        -
        (b.priority ?? 0)
      );

    for(const modifier of ordered){

      this.applyOne(
        data,
        modifier
      );

    }

  }


  static applyOne(
    data,
    modifier
  ){

    if(!modifier?.target)
      return;

    let current =
      foundry.utils.getProperty(
        data,
        modifier.target
      );

    if(current === undefined) {
      
      console.warn(
        "TARGET INTROUVABLE",
        modifier.target
      );
      
      return;

    }

    const value = Number(modifier.value ?? 0);

    switch(
      modifier.mode ?? "add"
    ){

      case "add":

        current += value;

      break;

      case "multiply":

        current *= value;

      break;

      case "override":

        current = value;

      break;

      case "min":

        current = Math.max(
          current,
          value
        );

      break;

      case "max":

        current = Math.min(
          current,
          value
        );

      break;

    }

    foundry.utils.setProperty(
      data,
      modifier.target,
      current
    );

  }


  /**
   * Calcul simple
   */
  static calculate(
    base,
    modifiers=[]
  ){

    let value = base;

    for(const modifier of modifiers){

      const amount = Number(modifier.value ?? 0);

      switch(modifier.mode){

        case "multiply":

          value *= amount;

        break;

        case "override":

          value = amount;

        break;

        default:

          value += amount;

      }

    }

    return value;

  }


  static debug(modifiers=[]){

    console.table(

      modifiers.map(
        m=>({

          cible:m.target,
          valeur:m.value,
          mode:m.mode,
          priorité:m.priority ?? 0,
          source:m.source?.name

        })
      )

    );

  }

}


export const collectModifiers =
ModifierSystem.collect.bind(ModifierSystem);

export const applyModifiers =
ModifierSystem.apply.bind(ModifierSystem);

export const applyModifier =
ModifierSystem.applyOne.bind(ModifierSystem);

export const calculateModifiedValue =
ModifierSystem.calculate.bind(ModifierSystem);

export const debugModifiers =
ModifierSystem.debug.bind(ModifierSystem);