import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { RollSystem } from "../systems/roll-system.mjs";
import { ContainerSystem } from "../systems/container-system.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ShinzoActorSheet extends ActorSheet {
  
  constructor(...args) {
    super(...args);
    this.editable = false; // Initialiser editable à true par défaut
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ['shinzo', 'sheet', 'actor'],
        width: 600,
        height: 600,
        tabs: [
          {
            navSelector: '.sheet-tabs',
            contentSelector: '.sheet-body',
            initial: 'stat',
          },
        ],
      }, 
      { inplace:false }
    );
  }

  /** @override */
  get template() {
    return `systems/shinzo/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = await super.getData();

    context.editable = this.editable;

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;

    this._prepareDisplayStats(context.system);

    context.flags = actorData.flags;

    context.system.derived = this.actor.system.derived;

    // Adding a pointer to CONFIG.SHINZO
    context.config = CONFIG.SHINZO;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedNote = await TextEditor.enrichHTML(
      this.actor.system.note,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );


    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Character-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareCharacterData(context) {
    // This is where you can enrich character-specific editor fields
    // or setup anything else that's specific to this type
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const objets = [];
    const armes = [];
    const armures = [];
    const sacs = [];
    const traits = [];
    const competences = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to objet.
      if (i.type === 'objet') {
        objets.push(i);
      }
      else if (i.type === 'arme') {
        armes.push(i);
      }
      else if (i.type === 'armure') {
        armures.push(i);
      }
      else if (i.type === 'sac') {

        i.content = i.system.content ?? [];

        sacs.push(i);
      }
      // Append to features.
      else if (i.type === 'trait') {
        traits.push(i);
      }
      // Append to spells.
      else if (i.type === 'competence') {
        competences.push(i);
      }
    }

    // Assign and return
    context.objet = objets;
    context.arme = armes;
    context.armure = armures;
    context.sac = sacs;
    context.trait = traits;
    context.competence = competences;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));


    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    /*Delete Inventory Items*/
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));

      // Afficher une boîte de dialogue de confirmation
      new Dialog({
        title: "Confirmation",
        content: `<p>Êtes-vous sûr de vouloir supprimer ${item.name} ?</p>`,
        buttons: {
          yes: {
            label: "Oui",
            callback: async () => {
              // Effectuer la suppression ici
              await item.delete();
              ui.notifications.info(`${item.name} supprimé.`);
            }
          },
          no: {
            label: "Non",
            callback: () => {}
          }
        },
        default: "no"
      }).render(true);
    })

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));
    html.on('click', '.deStat', this._bonusStats.bind(this));
    html.on('click', '.deArme', this._onRollArmes.bind(this));
    html.on('click', '.deSpe', this._onRollSpe.bind(this));
    html.on('change', '.equipped-toggle', this._equippedChange.bind(this));

    html.on('click', '.addBagage', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));

      // Afficher une boîte de dialogue de confirmation
      new Dialog({
        title: "Ajouter Objet",
        content: `<p>Quel objet voulez vous ajouter ?</p>`,
        buttons: {
          arme: {
            label: "Arme",
            callback: () => {
              const fakeEvent = {
                preventDefault: () => {},
                currentTarget: {
                  dataset: {
                    type: 'arme'
                  }
                }
              };
              this._onItemCreate(fakeEvent); 
            }
          },
          armure: {
            label: "Armure",
            callback: () => {
              const fakeEvent = {
                preventDefault: () => {},
                currentTarget: {
                  dataset: {
                    type: 'armure'
                  }
                }
              };
              this._onItemCreate(fakeEvent); 
            }
          },
          sac: {
            label: "Sac",
            callback: () => {
              const fakeEvent = {
                preventDefault: () => {},
                currentTarget: {
                  dataset: {
                    type: 'sac'
                  }
                }
              };
              this._onItemCreate(fakeEvent); 
            }
          },
          objet: {
            label: "Objet",
            callback: () => {
              const fakeEvent = {
                preventDefault: () => {},
                currentTarget: {
                  dataset: {
                    type: 'objet'
                  }
                }
              };
              this._onItemCreate(fakeEvent); 
            }
          }
        }
      }).render(true);
    })

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item[data-item-id]').each((i, li) => {

        li.setAttribute(
          'draggable',
          true
        );

        li.addEventListener(
          'dragstart',
          handler,
          false
        );

      });
    }

    // Gérer le clic sur le bouton d'activation/désactivation
    html.find("#toggle-edit").click(ev => {
      this.editable = !this.editable;
      this.render();
    });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    const createdItem = await Item.create(itemData, { parent: this.actor });

    return createdItem[0];
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[Caractéristique] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  async _onRollArmes(event){
    const jetFormule = event.currentTarget.dataset["formule"];
    const nomArme = event.currentTarget.dataset["nom"];
    const actor = this.actor;
    const bonus = actor.system.rdp.deg_physique.value;
    let roll;

    if(bonus != 0){
      roll = new Roll(jetFormule + "+" + bonus);
    } else {
      roll = new Roll(jetFormule);
    }
    
    const text = `${actor.name} inflige ses dégâts avec ${nomArme} :`
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: text,
    });
  }

  async _onRollSpe(event){
    const statName = event.target.dataset["label"];
    const jetFormule = "1d150";
  
    let roll = new Roll(jetFormule);
    await roll.evaluate();

    if(roll.total <= 100) {
      const text = `[${statName} Spé] C'est une réussite de spé !!!!`;
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: text,
      });
    } else if( roll.total > 100) {
      const text = `[${statName} Spé] C'est un échec de spé...`;
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: text,
      });
    }
  }

  async _equippedChange(event) {
    // Récupérer l'élément lié à ce changement
    const checkbox = event.target;
    const itemId = $(checkbox).closest('.item').data('itemId');
    
    // Récupérer l'élément de l'acteur
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.error('Item not found!');
      return;
    }
  
    // Inverser l'état 'equipped'
    const newEquippedState = !item.system.equipped;
  
    // Mettre à jour l'élément
    await item.update({ 'system.equipped': newEquippedState });
  
    // Optionnel : Actualiser l'affichage si nécessaire
    this.render(false);
  }

  async _bonusStats(event) {
    const statName = event.target.dataset.label;
    const statKey = event.target.dataset.statname;
    const prepared = RollSystem.getPreparedStat(this.actor, statKey);
    const valueStat = prepared.value;

    const content = `
    <h1 style="border: none; display: flex; font-size: 1.5em; justify-content: center;">Valeur de base : <nav style="text-decoration: underline; margin-left: 1%">${valueStat}</nav></h1>
    <p style=" display: flex; justify-content: space-between; align-items: center;">Bonus/Malus : <input type="number" id="modifierValue" style="width: 60%;"/> <button id="halveButton" style="width: 10%;">/2</button></p>`;

    new Dialog({
      title: `Modificateur du jet de ${statName}`,
      content: content,
      buttons: {
        desavantage: {
          label: "Desavantage",
          callback: (html) => {
            RollSystem.rollStat({

              actor: this.actor,
              stat: statKey,
              label: `${statName} : Désavantage`,
              modifier: Number(html.find("#modifierValue").val()),
              formula: "2d100k",
              prepared

            });
          }
        },
        normal: {
          label: "Neutre",
          callback: (html) => {
            RollSystem.rollStat({

              actor: this.actor,
              stat: statKey,
              label: statName,
              modifier: Number(html.find("#modifierValue").val()),
              formula: "1d100",
              prepared

            });
          }
        },
        avantage: {
          label: "Avantage",
          callback: (html) => {
            
            RollSystem.rollStat({

              actor: this.actor,
              stat: statKey,
              label: `${statName} : Avantage`,
              modifier: Number(html.find("#modifierValue").val()),
              formula: "2d100kl",
              prepared

            });
          }
        }
      },
      render: (html) => {
        html.find('#halveButton').click(() => {

          html.find('#modifierValue').val(RollSystem.getHalfPenalty(prepared.brut));

        });
      }
    }).render(true)
  }


  async _onDropItem(event){

    event.preventDefault();

    const data = TextEditor.getDragEventData(event);

    if(data.type !== "Item") return;

    await ContainerSystem.handleDrop({

      data,
      actor:this.actor

    });

  }

  _prepareDisplayStats(system) {

      const prepareGroup = (group) => {

          for (const [key, stat] of Object.entries(group ?? {})) {

              const prepared = RollSystem.prepareStat(
                  stat.value,
                  key,
                  stat.addCrit ?? 0
              );

              stat.brut = prepared.brut;
              stat.displayValue = prepared.value;
              stat.addCrit = prepared.crit;
          }
      };

      prepareGroup(system.gds_stats);
      prepareGroup(system.ss_stats?.ss_stats1);
      prepareGroup(system.ss_stats?.ss_stats2);
  }

}