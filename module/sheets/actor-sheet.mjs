import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { RollSystem } from "../systems/roll-system.mjs";
import { ContainerSystem } from "../systems/container-system.mjs";

/**
 * Extension de la feuille d'Acteur Shinzo pour Foundry VTT v13
 * @extends {ActorSheet}
 */
export class ShinzoActorSheet extends ActorSheet {
  
  constructor(...args) {
    super(...args);
    /** @type {boolean} Force l'état d'édition par défaut à false */
    this.editable = false;
    this._sectionsOpen = {
      arme: true,
      armure: true,
      consommable: true,
      bagage: true,
      traits: true,
      competences: true
    };
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['shinzo', 'sheet', 'actor'],
      width: 600,
      height: 600,
      scrollPositions: [
        ".sheet-body", 
        ".items-list", 
        ".bagageList",
        ".folder-content"
      ],
      dragDrop: [{ 
        dragSelector: ".items-list .item, .bagageList .item, .item", 
        dropSelector: null 
      }],
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'stat',
        },
      ],
    }, { inplace: false });
  }

  /** @override */
  get template() {
    return `systems/shinzo/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = await super.getData();
    context.editable = this.editable;

    // Extraction propre de l'objet pour les mutations de vue
    const actorData = this.document.toObject(false);
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Préparation des statistiques d'affichage
    this._prepareDisplayStats(context.system);
    context.system.derived = this.actor.system.derived;

    // Injection des variables globales de configuration
    context.config = CONFIG.SHINZO;

    // Tri et catégorisation des items de l'inventaire
    this._prepareItems(context);

    if (actorData.type === 'character') {
      this._prepareCharacterData(context);
    }

    // Enrichissement asynchrone des éditeurs de texte (ProseMirror)
    const textFields = ['biography', 'note'];
    for (const field of textFields) {
      context[`enriched${field.capitalize()}`] = await TextEditor.enrichHTML(
        this.actor.system[field] ?? "",
        {
          secrets: this.document.isOwner,
          rollData: this.actor.getRollData(),
          relativeTo: this.actor,
        }
      );
    }

    context.sectionsOpen = this._sectionsOpen;

    // Récupération globale v13 des effets (actifs, passifs et d'équipements)
    context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());

    return context;
  }

  /**
   * Modifications de contexte spécifiques aux PJ
   */
  _prepareCharacterData(context) {}

  /**
   * Organise et classe les Items dans l'inventaire de l'Acteur
   */
  _prepareItems(context) {
    const itemMap = {
      objet: [], arme: [], armure: [], sac: [],
      consommable: [], trait: [], competence: []
    };

    for (const item of context.items) {
      item.img ||= Item.DEFAULT_ICON;
      if (item.type in itemMap) {
        if (item.type === 'sac') {
          item.content = item.system.content ?? [];
        }
        itemMap[item.type].push(item);
      }
    }

    // Injection dynamique des listes triées dans le contexte
    Object.assign(context, itemMap);

    // DÉTERMINATION DYNAMIQUE DES VISIBILITÉS POUR LE TEMPLATE HBS (v13)
    context.hasEquippedWeapons = itemMap.arme.some(i => i.system.equipped === true);
    context.hasEquippedProtection = itemMap.armure.some(i => i.system.equipped === true) || itemMap.sac.some(i => i.system.equipped === true);
    
    context.hasBagages = itemMap.objet.length > 0 || 
                         itemMap.arme.some(i => !i.system.equipped) || 
                         itemMap.armure.some(i => !i.system.equipped) || 
                         itemMap.sac.some(i => !i.system.equipped);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const root = html[0] ?? html;

    /* ==========================================================================
       1. INITIALISATIONS DES SOUS-SYSTÈMES UNIQUE (HORS CLIC GLOBAL)
       ========================================================================== */

    // Mémorisation de l'état des volets pliants (Lié une seule fois à la racine)
    root.querySelectorAll('.items-list details, .ss_statsFond details').forEach(details => {
      details.addEventListener('toggle', (ev) => {
        const sectionType = details.dataset.section;
        if (!sectionType) return;
        this._sectionsOpen[sectionType] = details.open;
      });
    });

    /* ==========================================================================
       2. ÉCOUTEURS DES CHANGEMENTS DE FORMULAIRES (CASES À COCHER & INPUTS)
       ========================================================================== */
    if (this.isEditable) {
      root.addEventListener('change', async (ev) => {
        // Checkbox d'équipement actif
        const toggleEquipped = ev.target.closest('.equipped-toggle');
        if (toggleEquipped) {
          const li = toggleEquipped.closest('.item');
          const item = this.actor.items.get(li?.dataset.itemId);
          if (item) {
            await item.update({ 'system.equipped': !item.system.equipped });
            this.render(false);
          }
          return;
        }

        // Sauvegarde manuelle forcée de la Constitution
        if (ev.target.classList.contains('inputGDstats')) {
          const input = ev.target;
          const dataPath = input.name;
          const newValue = Number(input.value);

          if (!isNaN(newValue)) {
            await this.actor.update({ [dataPath]: newValue });
          }
        }
      });
    }

    /* ==========================================================================
       3. ÉCOUTEUR CENTRALISÉ DÉDIÉ UNIQUEMENT AUX CLICS DE BOUTONS PURS
       ========================================================================== */
    root.addEventListener('click', async (ev) => {
      // SÉCURITÉ DRAG & DROP : Si l'événement provient d'un glisser-déposer, on coupe tout de suite
      if (ev.button !== 0 || ev.dragEnd || ev.type === "drag" || ev.type === "drop") return;

      // On cible uniquement les boutons d'action réels
      const targetButton = ev.target.closest('#toggle-edit, [data-action="toggleSpe"], .item-edit, .rollable, .deStat, .deArme, .deSpe, .item-delete, .item-consume, .addBagage, .item-create, .effect-control, [data-action="configResources"]');
      if (!targetButton) return;

      ev.preventDefault();

      // 1. Gestionnaire du mode édition (Crayon)
      if (targetButton.id === 'toggle-edit') {
        this.editable = !this.editable;
        this.render();
        return;
      }

      // 2. Bouton Bascule Spécialisation
      if (targetButton.matches('[data-action="toggleSpe"]')) {
        if (this.editable) {
          const dataPath = targetButton.dataset.target;
          const currentState = foundry.utils.getProperty(this.actor, dataPath) === true;
          await this.actor.update({ [dataPath]: !currentState });
          return;
        } 
        return this._onRollSpe(ev, targetButton);
      }

      // 3. Édition d'un Item (Ouvrir la feuille d'arme, d'armure, etc.)
      if (targetButton.classList.contains('item-edit')) {
        const li = targetButton.closest('.item');
        const item = this.actor.items.get(li?.dataset.itemId);
        item?.sheet.render(true);
        return;
      }

      // 4. Jets de dés classiques (Attributs, compétences)
      if (targetButton.classList.contains('rollable') && !targetButton.classList.contains('deStat')) {
        return this._onRoll(ev, targetButton);
      }

      // 5. Fenêtre de modificateurs de caractéristiques (Avantage / Désavantage)
      if (targetButton.classList.contains('deStat')) {
        return this._bonusStats(ev, targetButton);
      }

      // 6. Jets de dégâts des armes
      if (targetButton.classList.contains('deArme')) {
        return this._onRollArmes(ev, targetButton);
      }

      // 7. Jets de capacités spéciales Spé (1d150 Anime effect)
      if (targetButton.classList.contains('deSpe')) {
        return this._onRollSpe(ev, targetButton);
      }

      // --- SÉCURITÉ : TOUTES LES ACTIONS CI-DESSOUS REQUIÈRENT LE MODE ÉDITION ---
      if (!this.isEditable) return;

      // 8. Suppression d'un Item de l'inventaire ou d'une capacité
      if (targetButton.classList.contains('item-delete')) {
        const li = targetButton.closest('.item');
        const item = this.actor.items.get(li?.dataset.itemId);
        if (!item) return;

        new Dialog({
          title: "Confirmation de suppression",
          content: `<p>Êtes-vous sûr de vouloir supprimer <strong>${item.name}</strong> ?</p>`,
          buttons: {
            yes: {
              label: "Supprimer",
              callback: async () => {
                await item.delete();
                ui.notifications.info(`${item.name} supprimé.`);
              }
            },
            no: { label: "Annuler" }
          },
          default: "no"
        }).render(true);
        return;
      }

      // 9. Consommation rapide d'un objet consommable
      if (targetButton.classList.contains('item-consume')) {
        const li = targetButton.closest('.item');
        const item = this.actor.items.get(li?.dataset.itemId);
        if (item) {
          await item.consume();
          this.render(false);
        }
        return;
      }

      // 10. Bouton d'ajout rapide de Bagages (Ouvre la boîte de choix d'Item)
      if (targetButton.classList.contains('addBagage')) {
        this._promptBagageCreation();
        return;
      }

      // 11. Création classique d'un élément (Traits, Capacités, Compétences dans vos sous-onglets)
      if (targetButton.classList.contains('item-create')) {
        this._onItemCreate(ev, targetButton);
        return;
      }

      // 12. Activation / Désactivation ou Configuration des Effets Actifs (Active Effects)
      if (targetButton.classList.contains('effect-control')) {
        ev.stopPropagation();

        const row = targetButton.closest('li');
        if (!row) return;

        const document = row.dataset.parentId === this.actor.id 
          ? this.actor 
          : this.actor.items.get(row.dataset.parentId);

        Object.defineProperty(ev, 'currentTarget', { 
          value: targetButton, 
          configurable: true 
        });

        onManageActiveEffect(ev, document);
        return;
      }

      // 13. Bouton Engrenage : Configuration avancée des Ressources
      if (targetButton.matches('[data-action="configResources"]')) {
        const templatePath = "systems/shinzo/templates/dialog/dialog-config-ressources.hbs";
        const templateData = { system: this.actor.system };
        const dialogContent = await renderTemplate(templatePath, templateData);

        new Dialog({
          title: `Configuration vitale : ${this.actor.name}`,
          content: dialogContent,
          buttons: {
            save: {
              label: "<i class='fas fa-save'></i> Enregistrer",
              callback: async (html) => {
                const updates = {
                  "system.health.max": Number(html.find("#cfg-hp-max").val()),
                  "system.power.max": Number(html.find("#cfg-pe-max").val()),
                  "system.rdp.deg_physique.b_m": Number(html.find("#cfg-rdp-deg").val()),
                  "system.rdp.res_physique.b_m": Number(html.find("#cfg-rdp-res").val()),
                  "system.rdm.deg_magique.b_m": Number(html.find("#cfg-rdm-deg").val()),
                  "system.rdm.res_magique.b_m": Number(html.find("#cfg-rdm-res").val())
                };

                await this.actor.update(updates);
                ui.notifications.info("Caractéristiques vitales mises à jour avec succès.");
              }
            },
            cancel: { label: "Annuler" }
          },
          default: "save"
        }).render(true);
        return;
      }
    });
  }


  /**
   * Boîte de dialogue interne pour l'ajout rapide de Bagages
   * @private
   */
  _promptBagageCreation() {
    const types = ['arme', 'armure', 'consommable', 'sac', 'objet'];
    const buttons = {};
    
    for (const type of types) {
      buttons[type] = {
        label: type.capitalize(),
        callback: () => this._createItemDocument(type)
      };
    }

    new Dialog({ title: "Ajouter Objet", content: "<p>Quel type d'objet voulez-vous ajouter à vos bagages ?</p>", buttons }).render(true);
  }

  /**
   * Création physique d'un document Item dans la base de données
   * @private
   */
  async _createItemDocument(type) {
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      system: {}
    };
    return Item.create(itemData, { parent: this.actor });
  }

  /**
   * Création d'un Item initiée par un clic d'en-tête (Mécanique template)
   * @private
   */
  async _onItemCreate(event, target) {
    const type = target.dataset.type;
    const data = foundry.utils.duplicate(target.dataset);
    delete data['type'];

    return Item.create({
      name: `New ${type.capitalize()}`,
      type: type,
      system: data,
    }, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   */
  _onRoll(event, target) {
    const dataset = target.dataset;

    if (dataset.rollType === 'item') {
      const li = target.closest('.item');
      const item = this.actor.items.get(li?.dataset.itemId);
      if (item) return item.roll();
    }

    if (dataset.roll) {
      const label = dataset.label ? `[Caractéristique] ${dataset.label}` : '';
      const roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Gestionnaire des dégâts des armes avec injection du bonus physique rdp
   */
  async _onRollArmes(event, target) {
    const formula = target.dataset.formule;
    const weaponName = target.dataset.nom;
    const bonus = Number(this.actor.system.rdp?.deg_physique?.value ?? 0);
    
    const finalFormula = bonus !== 0 ? `${formula}+${bonus}` : formula;
    const roll = new Roll(finalFormula);
    
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.actor.name} inflige ses dégâts avec ${weaponName} :`,
    });
  }

  /**
   * Jet d'aptitude spéciale (D150 anime effect)
   */
  async _onRollSpe(event, target) {
    const statName = target.dataset.label;
    const roll = new Roll("1d150");
    await roll.evaluate();

    const isSuccess = roll.total <= 100;
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `[${statName} Spé] ${isSuccess ? "C'est une réussite de spé !!!!" : "C'est un échec de spé..."}`,
    });
  }

  /**
   * Ouvre la configuration des modificateurs de dés (Avantage / Désavantage)
   */
  async _bonusStats(event, target) {
    const statName = target.dataset.label;
    const statKey = target.dataset.statname;
    const prepared = RollSystem.getPreparedStat(this.actor, statKey);

    const content = `
      <h1 style="border: none; display: flex; font-size: 1.5em; justify-content: center;">Valeur de base : <nav style="text-decoration: underline; margin-left: 1%">${prepared.value}</nav></h1>
      <p style="display: flex; justify-content: space-between; align-items: center;">Bonus/Malus : <input type="number" id="modifierValue" style="width: 60%;"/> <button id="halveButton" style="width: 10%;">/2</button></p>
    `;

    const rollConfig = (formula, labelSuffix) => (html) => {
      RollSystem.rollStat({
        actor: this.actor,
        stat: statKey,
        label: `${statName}${labelSuffix}`,
        modifier: Number(html.find("#modifierValue").val()),
        formula,
        prepared
      });
    };

    new Dialog({
      title: `Modificateur du jet de ${statName}`,
      content: content,
      buttons: {
        desavantage: { label: "Désavantage", callback: rollConfig("2d100k", " : Désavantage") },
        normal:      { label: "Neutre",      callback: rollConfig("1d100", "") },
        avantage:    { label: "Avantage",    callback: rollConfig("2d100kl", " : Avantage") }
      },
      render: (html) => {
        html.find('#halveButton').click(() => {
          html.find('#modifierValue').val(RollSystem.getHalfPenalty(prepared.brut));
        });
      }
    }).render(true);
  }

    /**
   * Gestionnaire principal des dépôts (Drop) sur la fiche de l'Acteur - Version Finale v13
   * @override
   * @protected
   */
  async _onDrop(event) {
    event.preventDefault();

    // 1. Extraction propre des données du Drag aux normes v13
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (!data) return super._onDrop(event);

    // 2. SÉCURITÉ ENTRÉE DANS UN SAC : 
    // Si l'objet glissé est lâché au-dessus d'une feuille de sac ouverte,
    // on coupe l'action de l'Acteur pour laisser la feuille du sac l'aspirer.
    if (event.target.closest('.sheet.item, .shinzo.item, .bag-contents')) {
      return false; 
    }

    // 3. INTERCEPTION CRITIQUE SAC (SORTIE DU SAC) :
    // Si l'objet provient d'un sac, on délègue IMMÉDIATEMENT au ContainerSystem
    // et on coupe l'exécution pour empêcher Foundry de lancer son code natif qui plante !
    if (data.fromContainer === true || data.type === "ContainedItem") {
      await ContainerSystem.handleDrop({
        data,
        actor: this.actor // Destination : l'inventaire principal du personnage
      });
      return; // On stoppe tout ici, le TypeError de fromDropData n'arrivera plus jamais !
    }

    // 4. IMPORTATION COMPENDIUMS & MENU LATÉRAL :
    // Si c'est un objet normal, on redonne sagement la main au moteur natif de Foundry v13
    return super._onDrop(event);
  }



  async _onConsumeItem(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);
    if (item) {
      await item.consume();
      this.render(false);
    }
  }

  _prepareDisplayStats(system) {
    const prepareGroup = (group, useBrut = false) => {
      for (const [key, stat] of Object.entries(group ?? {})) {
        const rollValue = useBrut ? stat.brut : stat.value;
        const prepared = RollSystem.prepareStat(rollValue, key, stat.addCrit ?? 0);
        stat.displayValue = prepared.value;
        stat.addCrit = prepared.crit;
      }
    };

    prepareGroup(system.gds_stats, true);
    prepareGroup(system.ss_stats?.ss_stats1);
    prepareGroup(system.ss_stats?.ss_stats2);
  }
}
