import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";


/**
 * Shinzo Item Sheet
 *
 * Gestion commune de tous les items Shinzo.
 *
 * Les sacs utilisent un inventaire interne basé
 * sur des objets Item complets stockés dans system.content.
 */
export class ShinzoItemSheet extends ItemSheet {


  /**
   * Options de la fenêtre
   */
  static get defaultOptions() {

    return foundry.utils.mergeObject(
      super.defaultOptions,
      {
        classes:[
          "shinzo",
          "sheet",
          "item"
        ],
        width:520,
        height:480,
        tabs:[
          {
            navSelector:".sheet-tabs",
            contentSelector:".sheet-body"
          }
        ]
      }
    );

  }


  /**
   * Template dynamique selon le type d'item
   */
  get template(){

    return `systems/shinzo/templates/item/item-${this.item.type}-sheet.hbs`;

  }


  /**
   * Préparation des données envoyées au Handlebars
   */
  async getData(options={}){

    const context = await super.getData(options);

    /*
     * Clone sécurisé de l'item
     */
    const itemData = this.item.toObject(false);

    /*
     * Données système
     */
    context.system = itemData.system;

    context.flags = itemData.flags;

    context.config = CONFIG.SHINZO;

    /*
     * Description enrichie
     */
    context.enrichedDescription =
      await TextEditor.enrichHTML(

        this.item.system.description ?? "",

        {

          secrets:this.document.isOwner,

          rollData:this.item.getRollData(),

          relativeTo:this.item

        }

      );

    /*
     * Effet enrichi
     */
    context.enrichedEffect =
      await TextEditor.enrichHTML(

        this.item.system.effect ?? "",

        {

          secrets:this.document.isOwner,

          rollData:this.item.getRollData(),

          relativeTo:this.item

        }

      );

    /*
     * Note enrichie
     */
    context.enrichedNote =
      await TextEditor.enrichHTML(

        this.item.system.note ?? "",

        {

          secrets:this.document.isOwner,

          rollData:this.item.getRollData(),

          relativeTo:this.item

        }

      );

    /*
     * Gestion du contenu des sacs
     *
     * system.content contient maintenant
     * des objets Item complets.
     */
    if(this.item.type === "sac"){

      context.contents =
        foundry.utils.deepClone(
          this.item.system.content ?? []
        );

    }

    /*
     * Active Effects
     */
    context.effects =
      prepareActiveEffectCategories(
        this.item.effects
      );

    return context;

  }


  /**
   * Activation des événements
   */
  activateListeners(html){

    super.activateListeners(html);

    /*
     * Drop dans un sac
     */
    html.find(".bag-contents").on("drop",this._onDropItem.bind(this));

    /*
     * Edition d'un objet contenu
     */
    html.find(".item-edit").click(this._onEditContainedItem.bind(this));

    /*
     * Suppression d'un objet contenu
     */
    html.find(".item-delete").click(this._onRemoveItem.bind(this));

    /*
     * Drag depuis le sac
     */
    html.find(".item").on("dragstart", this._onDragStartContainedItem.bind(this));

    /*
     * Active Effects
     */
    if(!this.isEditable)
      return;

    html.on(
      "click",
      ".effect-control",
      (event)=>{

        onManageActiveEffect(
          event,
          this.item
        );

      }
    );
  }

    /**
   * Ajout d'un item dans un sac
   *
   * Source :
   * - acteur
   * - autre inventaire
   *
   * Destination :
   * - system.content du sac
   */
  async _onDropItem(event){

    event.preventDefault();

    let data;

    try {

      data =
        JSON.parse(
          event.originalEvent.dataTransfer.getData(
            "text/plain"
          )
        );

    }

    catch(error){

      console.error(
        "Drop item invalide",
        error
      );

      return;

    }

    if(data.type !== "Item")
      return;

    const sourceItem =
      await fromUuid(data.uuid);

    if(!sourceItem)
      return;

    /*
     * Copie complète de l'objet
     */
    const itemData =
      sourceItem.toObject();

    /*
     * Nouvel ID interne
     */
    itemData._id =
      foundry.utils.randomID();

    const content =
      foundry.utils.deepClone(
        this.item.system.content ?? []
      );

    content.push(
      itemData
    );

    await this.item.update({

      "system.content":
        content

    });

    /*
     * Si l'objet vient d'un acteur
     *
     * on le retire de son inventaire
     */
    if(sourceItem.actor){

      await sourceItem.delete();

    }

    ui.notifications.info(
      `${sourceItem.name} placé dans le sac`
    );

  }


  /**
   * Edition d'un objet dans le sac
   */
  async _onEditContainedItem(event){

    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;

    const itemData = this.item.system.content.find(item => item._id === itemId);

    if(!itemData) return;

    /*
     * Création d'une instance temporaire
     */
    const tempItem = new CONFIG.Item.documentClass(foundry.utils.deepClone(itemData), {parent: this.item.actor} );

    tempItem.sheet.render(true);

    /*
     * Quand la fiche est sauvegardée
     */
    tempItem.sheet._updateObject =
      async(formData)=>{

        const content = foundry.utils.deepClone(this.item.system.content);

        const index = content.findIndex(i => i._id === itemId);

        if(index === -1)
          return;

        /*
         * Reconstruction de l'objet
         */
        const updated = foundry.utils.mergeObject(content[index], formData);

        content[index] = updated;

        await this.item.update({"system.content": content});

      };

  }


  /**
   * Suppression d'un objet du sac
   */
  async _onRemoveItem(event){

    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;

    const content = foundry.utils.deepClone( this.item.system.content ?? [] );

    const index = content.findIndex( item => item._id === itemId );

    if(index === -1) return;

    const item = content[index];

    new Dialog({

      title: "Supprimer l'objet",

      content:`<p> Retirer <b>${item.name}</b> du sac ? </p>`,

      buttons:{

        yes:{

          label: "Oui",

          callback:
            async()=>{
              content.splice( index, 1 );

              await this.item.update({ "system.content": content });

            }

        },

        no:{ label:"Non" }

      },

      default: "no"

    }).render(true);

  }


  /**
   * Sortie d'un objet du sac vers l'acteur
   *
   * Drag & Drop
   */
  _onDragStartContainedItem(event){

    const itemId = event.currentTarget.dataset.itemId;

    const item = this.item.system.content.find(i => i._id === itemId);

    if(!item) return;

    const dragData = {
      type: "Item",
      data: item,
      itemId: item._id,
      fromContainer: true,
      containerUuid:this.item.uuid
    };

    event.originalEvent.dataTransfer.setData(
      "text/plain",
      JSON.stringify(dragData)
    );

  }

}