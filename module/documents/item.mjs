import { prepareItemData } from "../systems/item/item-system.mjs";


/**
 * Shinzo Item Document
 */
export class ShinzoItem extends Item {

  /**
   * Préparation des données de base
   */
  prepareData() {

    super.prepareData();

  }


  /**
   * Préparation des données calculées
   */
  prepareDerivedData() {

    prepareItemData(this);

  }


  static defineSchema(){

  return {

  ...super.defineSchema()

  };

  }

  static get type(){

  return "Item";

  }

  _onCreateEmbeddedDocuments(embeddedName, documents, result, options){

  super._onCreateEmbeddedDocuments(embeddedName, documents, result, options);

  }


  /**
   * Données accessibles aux jets
   */
  getRollData() {

    const rollData = foundry.utils.deepClone(this.system);

    if(this.actor){

      rollData.actor = this.actor.getRollData();

    }

    return rollData;

  }


  /**
   * Utilisation de l'objet
   */
  async roll(){

    const item = this;

    const speaker = ChatMessage.getSpeaker({actor: this.actor ?? null});

    const rollMode = game.settings.get("core", "rollMode");

    const label = `[${item.type}] ${item.name}`;

    let content = "";

    switch(item.type){

      case "trait":

        content =
          `
          ${item.system.effect ?? ""}
          <i>${item.system.description ?? ""}</i>
          `;

        break;

      case "competence":

        content =
          `
          Coût :
          ${item.system.cost ?? ""}
          ${item.system.unit ?? ""}
          <br>
          ${item.system.effect ?? ""}
          <br>
          <i>${item.system.description ?? ""}</i>
          `;

        break;

      case "arme":

        content =
          `
          Dégâts :
          ${item.system.damage ?? ""}
          <br>

          Type :
          ${item.system.type ?? ""}

          <br>

          ${item.system.effect ?? ""}

          <br>

          <i>${item.system.description ?? ""}</i>
          `;

        break;

      case "armure":

        content =
          `
          Résistance physique :
          ${item.system.resPhysique ?? 0}

          <br>

          Résistance magique :
          ${item.system.resMagique ?? 0}

          <br>

          ${item.system.effect ?? ""}

          <br>

          <i>${item.system.description ?? ""}</i>
          `;

        break;

      case "sac":

        content =
          `
          Capacité :
          ${item.system.poidsMax ?? ""}

          <br>

          ${item.system.effect ?? ""}

          <br>

          <i>${item.system.description ?? ""}</i>
          `;

        break;

      case "objet":

        content =
          `
          ${item.system.effect ?? ""}

          <br>

          <i>${item.system.description ?? ""}</i>
          `;

        break;

    }

    /**
     * Si l'objet possède une présentation
     */
    if(content){

      await ChatMessage.create({

        speaker,

        rollMode,

        flavor: label,

        content

      });

      return;

    }

    /**
     * Sinon tentative de jet classique
     */
    const rollData = this.getRollData();

    if(!rollData.formula) return;

    const roll = new Roll(rollData.formula, rollData);

    await roll.toMessage({

      speaker,

      rollMode,

      flavor: label

    });

    return roll;

  }

}