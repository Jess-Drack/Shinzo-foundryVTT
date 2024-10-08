import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

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
    });
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
    const context = super.getData();

    context.editable = this.editable;

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

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
        // Necessary in v11, can be removed in v12
        async: true,
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
        // Necessary in v11, can be removed in v12
        async: true,
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
              item.delete();
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
    html.on('change', '.equiped-toggle', this._equippedChange.bind(this));

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
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
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
    console.log("Objet créé : ", createdItem);

    return createdItem;
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

  async rollStats(valueStat, statName, statNameAbridged, crit, jetFormule){

    let reussiteCrit = 0;
    let echecCrit = 0;

    if(crit > 0 ){
      reussiteCrit = crit;
    } else if (crit < 0) {
      echecCrit = -(crit);
    }
  
    let roll = new Roll(jetFormule);
    await roll.evaluate();

    if(roll.total <= 5 + reussiteCrit) {
      const text = `[<span class="reussite">${statName}</span>] C'est une réussite critique !!!!`
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: text,
        content: `
          <div class="dice-roll">
            <div class="dice-result">
              <div class="dice-formula">${jetFormule}</div>
              <div class="dice-tooltip">
                <section class="tooltip-part">
                  <div class="dice">
                    <header class="part-header flexrow">
                      <span class="part-formula">${jetFormule}</span>
                
                      <span class="part-total">${roll.total}</span>
                    </header>
                  <ol class="dice-rolls">
                    <li class="roll die d100 max">${roll.total}</li>
                  </ol>
                </div>
              </section>
            </div>
              <h4 class="dice-total reussite">${roll.total}</h4>
            </div>
          </div>`,
      });
    } else if(roll.total >= (96 - echecCrit)) {
      const text = `[<span class="echec">${statName}</span>] C'est un échec critique !!!!`
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: text,
        content: `
          <div class="dice-roll">
            <div class="dice-result">
              <div class="dice-formula">${jetFormule}</div>
              <div class="dice-tooltip">
                <section class="tooltip-part">
                  <div class="dice">
                    <header class="part-header flexrow">
                      <span class="part-formula">${jetFormule}</span>
                
                      <span class="part-total">${roll.total}</span>
                    </header>
                  <ol class="dice-rolls">
                    <li class="roll die d100 min">${roll.total}</li>
                  </ol>
                </div>
              </section>
            </div>
              <h4 class="dice-total echec">${roll.total}</h4>
            </div>
          </div>`,
      });
    } else if( roll.total < valueStat) {
      if(statNameAbridged === "con" || statNameAbridged === "mag" || statNameAbridged === "pug" || statNameAbridged === "cac" || statNameAbridged === "pre" || statNameAbridged === "esq"){
        const rollDiff = valueStat - roll.total;
        const text = `[<span class="reussite">${statName}</span>] C'est une réussite. La différence est de ${rollDiff}.`;
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: text,
        });
      } else {
        const text = `[<span class="reussite">${statName}</span>] C'est une réussite.`;
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: text,
        });
      }
    } else if( roll.total > valueStat) {
      const text = `[<span class="echec">${statName}</span>] C'est un echec.`
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: text,
      });
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
  
    // Inverser l'état 'equiped'
    const newEquippedState = !item.system.equiped;
  
    // Mettre à jour l'élément
    await item.update({ 'system.equiped': newEquippedState });
  
    // Optionnel : Actualiser l'affichage si nécessaire
    this.render(false);
  }

  async _bonusStats(event) {
    const valueStat = event.target.dataset["dice"];
    const statName = event.target.dataset["label"];
    const statNameAbridged = event.target.dataset["statname"];
    let crit = Number(event.target.dataset["crit"]);

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
            const jetFormule = "2d100k";    
            const newStatName = statName + " : Désavantage";      
            const modifier = Number(html.find('#modifierValue').val());
            let newValueStat = Number(valueStat) + modifier;
            if (newValueStat < 15) {
              crit = -(15 - newValueStat);
              newValueStat = 15;
            } else if (newValueStat > 85) {
              crit = Math.floor((newValueStat - 85) / 2);
              newValueStat = 85;
            };
            this.rollStats(newValueStat, newStatName, statNameAbridged, crit, jetFormule);
          }
        },
        normal: {
          label: "Neutre",
          callback: (html) => {
            const jetFormule = "1d100";
            const modifier = Number(html.find('#modifierValue').val());
            let newValueStat = Number(valueStat) + modifier;
            if (newValueStat < 15) {
              crit = -(15 - newValueStat);
              newValueStat = 15;
            } else if (newValueStat > 85) {
              crit = Math.floor((newValueStat - 85) / 2);
              newValueStat = 85;
            };
            this.rollStats(newValueStat, statName, statNameAbridged, crit, jetFormule);
          }
        },
        avantage: {
          label: "Avantage",
          callback: (html) => {         
            const jetFormule = "2d100kl";   
            const newStatName = statName + " : Avantage";
            const modifier = Number(html.find('#modifierValue').val());
            let newValueStat = Number(valueStat) + modifier;
            if (newValueStat < 15) {
              crit = -(15 - newValueStat);
              newValueStat = 15;
            } else if (newValueStat > 85) {
              crit = Math.floor((newValueStat - 85) / 2);
              newValueStat = 85;
            };
            this.rollStats(newValueStat, newStatName, statNameAbridged, crit, jetFormule);
          }
        }
      },
      render: (html) => {
        html.find('#halveButton').click(() => {
          const halfMalus = Math.floor(-valueStat / 2);
          html.find('#modifierValue').val(halfMalus);
        });
      }
    }).render(true)
  }
}