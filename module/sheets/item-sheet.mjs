import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ShinzoItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['shinzo', 'sheet', 'item'],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = 'systems/shinzo/templates/item';
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = this.document.toObject(false);

    // Enrich description info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedDescription = await TextEditor.enrichHTML(
      this.item.system.description,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.item.getRollData(),
        // Relative UUID resolution
        relativeTo: this.item,
      }
    );

    context.enrichedEffect = await TextEditor.enrichHTML(
      this.item.system.effect,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.item.getRollData(),
        // Relative UUID resolution
        relativeTo: this.item,
      }
    );

    context.enrichedNote = await TextEditor.enrichHTML(
      this.item.system.note,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.item.getRollData(),
        // Relative UUID resolution
        relativeTo: this.item,
      }
    );

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Adding a pointer to CONFIG.SHINZO
    context.config = CONFIG.SHINZO;

    // Si c'est un sac, initialiser une structure pour contenir des items
    if (itemData.type === "sac") {
      itemData.content = itemData.system.content || [];
    }

    // Prepare active effects for easier access
    context.effects = prepareActiveEffectCategories(this.item.effects);

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Ajouter un event listener pour le drop
    html.find(".bag-contents").on("drop", this._onDropItem.bind(this));

    // Écoute l'événement pour supprimer un item du sac
    html.find(".item-delete").click(this._onRemoveItem.bind(this));

    // Écoute l'événement pour éditer un item
    html.find(".item-edit").click(this._onEditItem.bind(this));

    // Écouter l'événement click sur le bouton d'ajout d'item (pas actif)
    html.find(".item-create").click(this._onAddItem.bind(this));

    // Écoute les événements de drag pour permettre de sortir un item du sac
    html.find('.item').on('dragstart', this._onDragStartItem.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    // Active Effect management
    html.on('click', '.effect-control', (ev) =>
      onManageActiveEffect(ev, this.item)
    );
  }

  // Fonction qui s'exécute lorsque l'item est "drop" dans le sac
  async _onDropItem(event) {
    event.preventDefault();
    
    // Récupérer les données de l'événement de drag & drop
    let data;
    try {
       data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
    } catch (err) {
       console.error("Échec de l'extraction des données de l'événement drop:", err);
       return;
    }

    // Vérifie que l'item déposé provient bien du système
    if (data.type !== "Item") {
       console.warn("Le type de l'objet déposé n'est pas un Item:", data.type);
       return;
    }

    // Récupérer l'item depuis son UUID
    let droppedItem;
    try {
       droppedItem = await fromUuid(data.uuid);
    } catch (err) {
       console.error("Impossible de récupérer l'item via son UUID:", err);
       return;
    }

    if (!droppedItem) {
       console.warn("Aucun item trouvé pour cet UUID.");
       return;
    }

    // Convertir l'item en format JSON pour le stocker dans le sac
    let itemData = foundry.utils.duplicate(droppedItem);
    itemData._id = foundry.utils.randomID();

    // Ajouter l'item au contenu du sac
    let currentItems = this.item.system.content || [];
    currentItems.push(itemData);

    // Mettre à jour l'item sac avec le nouvel item ajouté
    await this.item.update({
       "system.content": currentItems
    });

    ui.notifications.info(`L'item ${droppedItem.name} a été ajouté au sac.`);
  }

  async _onRemoveItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const itemName = event.currentTarget.dataset.itemName

    // Afficher une boîte de dialogue de confirmation
    new Dialog({
      title: "Confirmation",
      content: `<p>Êtes-vous sûr de vouloir supprimer ${itemName} ?</p>`,
      buttons: {
        yes: {
          label: "Oui",
          callback: async () => {
            // Effectuer la suppression ici
            // Filtrer les items pour retirer l'item sélectionné
            let updatedItems = this.item.system.content.filter(i => i._id !== itemId);

            // Met à jour le sac avec le nouvel état des items
            await this.item.update({
              "system.content": updatedItems
            });
          }
        },
        no: {
          label: "Non",
          callback: () => {}
        }
      },
      default: "no"
    }).render(true);
  }

  _onEditItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;

    // Récupérer l'item dans le contenu du sac
    const itemData = this.item.system.content.find(i => i._id === itemId);
 
    // Créer une nouvelle instance temporaire d'Item dans Foundry avec ces données
    let tempItem = new Item(itemData, { parent: this.actor });
 
    // Ouvrir la fiche de cet item
    tempItem.sheet.render(true);
 
    // Capturer la soumission de la fiche
    tempItem.sheet._onSubmit = async (event) => {
      event.preventDefault();

      // Utiliser _getSubmitData pour obtenir les données du formulaire
      const updatedData = tempItem.sheet._getSubmitData();

      // Mettre à jour les données de l'item dans le sac
      const itemIndex = this.item.system.content.findIndex(i => i._id === itemId);

      if (itemIndex !== -1) {
          // Cloner l'item pour éviter les problèmes d'extensibilité
          let clonedItem = JSON.parse(JSON.stringify(this.item.system.content[itemIndex]));

          // Mettre à jour les données de l'item avec celles du formulaire
          for (let key in updatedData) {
              clonedItem[key] = updatedData[key];
          }

          // Remplacer l'item dans le sac avec l'item cloné et modifié
          this.item.system.content[itemIndex] = clonedItem;

          // Mettre à jour le sac pour sauvegarder les modifications
          await this.item.update({
              "system.content": this.item.system.content
          });

          ui.notifications.info(`L'item ${updatedData.name} a été mis à jour dans le sac.`);
      } else {
          console.error(`L'item avec l'ID ${itemId} n'a pas été trouvé dans le sac.`);
      }
    };
  }

  async _onAddItem(event) {
    event.preventDefault();

    const header = event.currentTarget;
    console.log(header.dataset)
    // Get the type of item to create.
    const type = header.dataset.type;
    console.log(type)
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    console.log(data)
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    console.log(name)
    // Prepare the item object.
    const newItemData = {
      name: name,
      type: type,
      system: data,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete newItemData.system['type'];

    // Créer une nouvelle instance temporaire d'Item
    let newItem = new Item(newItemData);

    // Ouvrir la fiche d'item pour permettre la modification
    newItem.sheet.render(true);

    // Attendre la soumission de la fiche et ajout au sac
    newItem.sheet._onSubmit = async (event) => {
        event.preventDefault();

        // Obtenir les données du formulaire
        const updatedData = newItem.sheet._getSubmitData();

        // Ajouter l'item dans le contenu du sac
        this.item.system.content.push(updatedData);

        // Mettre à jour le sac pour sauvegarder les modifications
        await this.item.update({
            "system.content": this.item.system.content
        });

        ui.notifications.info(`L'item ${updatedData.name} a été ajouté au sac.`);
    };
  }

  _onDragStartItem(event) {
    // Si jQuery est utilisé, accéder à l'événement natif
    const nativeEvent = event.originalEvent || event;

    // Vérification que dataTransfer est disponible dans l'événement natif
    if (!nativeEvent || !nativeEvent.dataTransfer) {
        console.error("L'événement 'dragstart' n'a pas de dataTransfer valide.");
        return;
    }

    // Récupérer l'ID de l'item à partir de l'attribut data
    const itemId = event.currentTarget.dataset.itemId;

    // Vérifier que l'itemId existe bien
    if (!itemId) {
        console.error("Aucun ID d'item trouvé dans l'élément HTML.");
        return;
    }

    // Récupérer les données de l'item depuis le sac
    const itemData = this.item.system.content.find(i => i._id === itemId);

    if (!itemData) {
        console.error(`L'item avec l'ID ${itemId} n'a pas été trouvé dans le sac.`);
        return;
    }

    // Créer l'objet de transfert pour le drag
    const dragData = {
        type: "Item",
        data: itemData
    };

    // Stocker les données sous forme de texte dans l'événement de drag
    nativeEvent.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }
}
