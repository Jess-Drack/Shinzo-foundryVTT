import { prepareCharacterData } from "../systems/actor/character-system.mjs";
import { prepareNpcData } from "../systems/actor/npc-system.mjs";


/**
 * Shinzo Actor Document
 */
export class ShinzoActor extends Actor {



  /**
   * Configuration des DataModels
   */
  static defineSchema() {

    return {

      ...super.defineSchema()

    };

  }





  /**
   * Préparation des données de base
   */
  prepareData() {

    super.prepareData();

  }







  /**
   * Calcul des données dérivées
   *
   * Appelé automatiquement par Foundry V13
   */
  prepareDerivedData() {


    super.prepareDerivedData();


    switch (this.type) {


      case "character":

        prepareCharacterData(this);

      break;



      case "npc":

        prepareNpcData(this);

      break;

    }

  }


  /**
   * Données disponibles pour les jets
   *
   * Les jets doivent utiliser
   * les valeurs calculées dans derived.
   */
  getRollData() {


    const data =
      foundry.utils.deepClone(
        this.system
      );



    /*
     * Ajout des valeurs finales
     */
    data.derived =
      foundry.utils.deepClone(
        this.system.derived ?? {}
      );



    switch(this.type){


      case "character":

        this._prepareCharacterRollData(data);

      break;



      case "npc":

        this._prepareNpcRollData(data);

      break;


    }



    return data;

  }








  /**
   * Données de jets personnage
   */
  _prepareCharacterRollData(data){


    if(!data.derived?.gds_stats)
      return;



    /*
     * Rend les stats accessibles directement
     *
     * Exemple :
     * @agi.value
     */
    for(
      const [key,value]
      of Object.entries(
        data.derived.gds_stats
      )
    ){


      data[key] =
        foundry.utils.deepClone(
          value
        );


    }



  }


  /**
   * Données de jets PNJ
   */
  _prepareNpcRollData(data){


    if(!data.derived?.gds_stats)
      return;



    for(
      const [key,value]
      of Object.entries(
        data.derived.gds_stats
      )
    ){


      data[key] =
        foundry.utils.deepClone(
          value
        );


    }


  }



}