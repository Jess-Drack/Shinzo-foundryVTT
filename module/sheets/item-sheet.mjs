import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

import { ContainerSystem } from "../systems/container-system.mjs";


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

    if (this.item.type === "sac") {

      this._contents = [];

        context.contents = this._contents;

        for (const data of this.item.system.content ?? []) {

            const tempItem = new CONFIG.Item.documentClass(
                foundry.utils.deepClone(data),
                {
                    parent: null,
                    temporary: true
                }
            );

            tempItem.testUserPermission = (user, level)=>{
                return this.item.testUserPermission(user, level);
            };

            this._contents.push(tempItem);
        }
    }

    /*
     * Active Effects
     */
    context.effects = prepareActiveEffectCategories(this.item.effects);

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
    if(!this.isEditable) return;

    html.on("click", ".effect-control", (event)=>{

        onManageActiveEffect(event, this.item);

      }
    );

    html.find(".consume-item").click(this._onConsumeItem.bind(this));

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

  const data = TextEditor.getDragEventData(event.originalEvent);

  if(data.type !== "Item") return;


  await ContainerSystem.handleDrop({

    data,

    targetContainer:this.item

  });

  this.render(false);

  }


  /**
   * Edition d'un objet dans le sac
   */
  async _onEditContainedItem(event){

      event.preventDefault();

      const itemId = event.currentTarget.dataset.itemId;

      const tempItem = this._contents.find(item => item.id === itemId);

      if(!tempItem) return;

      const sheet = tempItem.sheet;

      /*
      * On sauvegarde la méthode originale
      */
      const originalUpdate = sheet._updateObject.bind(sheet);

      /*
      * On surcharge la sauvegarde
      */
      sheet._updateObject = async(event, formData)=>{

          /*
          * Force la récupération des valeurs des éditeurs
          */
          if(sheet.form){

              const editors = sheet.form.querySelectorAll(".editor-content");

              for(const editor of editors){

                  const target = editor.closest(".editor")?.dataset?.edit;

                  if(target){

                    formData[target] = editor.innerHTML;

                  }

              }

          }

          await ContainerSystem.updateContainedItem(
              this.item,
              itemId,
              formData
          );

          /*
          * Met à jour l'instance temporaire
          */
          await tempItem.updateSource(
              formData
          );

      };

      sheet.render(true);

  }


  /**
  * Suppression d'un objet du sac
  */
  async _onRemoveItem(event) {

    event.preventDefault();

    const itemId = event.currentTarget.dataset.itemId;

    const item = this._contents.find(i => i.id === itemId);

    if (!item) return;

    new Dialog({

      title: "Supprimer l'objet",

      content: `<p>Retirer <b>${item.name}</b> du sac ?</p>`,

      buttons: {

        yes: {

          label: "Oui",

          callback: async () => {

            await ContainerSystem.removeFromContainer(
              this.item,
              itemId
            );

            this.render(false);

          }

        },

        no: {
          label: "Non"
        }

      },

      default: "no"

    }).render(true);

  }


  /**
   * Sortie d'un objet du sac vers l'acteur
   *
   * Drag & Drop
   */
  _onDragStartContainedItem(event) {

    const itemId = event.currentTarget.dataset.itemId;

    const item = this._contents.find(i => i.id === itemId);

    if (!item) return;

    const dragData = {

      type: "Item",

      data: item.toObject(),

      itemId: item.id,

      fromContainer: true,

      containerUuid: this.item.uuid

    };

    event.originalEvent.dataTransfer.effectAllowed = "move";

    event.originalEvent.dataTransfer.setData(
      "text/plain",
      JSON.stringify(dragData)
    );

  }


  async _onConsumeItem(event){

    switch (this.system.consumeType) {

        case "quantity":
            return this.consumeQuantity();

        case "charges":
            return this.consumeCharge();

    }

  }


  async consumeQuantity() {

    if (this.system.quantity <= 0)
        return false;

    await this.update({
        "system.quantity": this.system.quantity - 1
    });

    if (this.system.quantity - 1 <= 0)
        await this.delete();

    return true;

  }
  

  async consumeCharge() {

    if (this.system.charges <= 0)
        return false;

    await this.update({
        "system.charges": this.system.charges - 1
    });

    return true;

  }

}