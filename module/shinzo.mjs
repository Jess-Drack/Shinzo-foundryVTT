// Import document classes.
import { ShinzoActor } from './documents/actor.mjs';
import { ShinzoItem } from './documents/item.mjs';
// Import sheet classes.
import { ShinzoActorSheet } from './sheets/actor-sheet.mjs';
import { ShinzoItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { SHINZO } from './helpers/config.mjs';

import { registerCustomEffects } from './helpers/effects.mjs';

import { CharacterModel } from "./data/actor/character-model.mjs";
import { NPCModel } from "./data/actor/npc-model.mjs";

import { ArmeModel } from "./data/item/arme-model.mjs";
import { ArmureModel } from "./data/item/armure-model.mjs";
import { ObjetModel } from "./data/item/objet-model.mjs";
import { SacModel } from "./data/item/sac-model.mjs";
import { CompetenceModel } from "./data/item/competence-model.mjs";
import { TraitModel } from "./data/item/trait-model.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.shinzo = {
    ShinzoActor,
    ShinzoItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.SHINZO = SHINZO;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d100 + @ss_stats.ss_stats2.vit.value',
    decimals: 2,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = ShinzoActor;
  CONFIG.Item.documentClass = ShinzoItem;

  /**
  * DataModels V13
  */
  CONFIG.Actor.dataModels = {

    character: CharacterModel,
    npc: NPCModel

  };

  CONFIG.Item.dataModels = {

    arme: ArmeModel,
    armure: ArmureModel,
    objet: ObjetModel,
    sac: SacModel,
    competence: CompetenceModel,
    trait: TraitModel

  };

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('shinzo', ShinzoActorSheet, {
    makeDefault: true,
    label: 'SHINZO.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('shinzo', ShinzoItemSheet, {
    makeDefault: true,
    label: 'SHINZO.SheetLabels.Item',
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {

  // Migration des anciennes données
  //await migrateWorld();

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));

  registerCustomEffects();
});


/**
 * Migration des données du monde
 */
/*async function migrateWorld() {

  console.log("SHINZO | Vérification des données du monde...");

  for (const actor of game.actors) {

    for (const item of actor.items) {

      const update = {};

      switch (item.type) {

        case "armure":

          if (typeof item.system.poids !== "number")
            update["system.poids"] = Number(item.system.poids) || 0;

          if (typeof item.system.resPhysique !== "number")
            update["system.resPhysique"] = Number(item.system.resPhysique) || 0;

          if (typeof item.system.resMagique !== "number")
            update["system.resMagique"] = Number(item.system.resMagique) || 0;

          break;

        case "sac":

          if (typeof item.system.poidsMax !== "number")
            update["system.poidsMax"] = Number(item.system.poidsMax) || 0;

          break;
      }

      if (Object.keys(update).length) {
        console.log(`SHINZO | Migration de ${item.name}`);
        await item.update(update, { diff: false, noHook: true });
      }
    }
  }

  console.log("SHINZO | Migration terminée.");
}*/

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.shinzo.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'shinzo.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

Hooks.on('renderChatMessage', (message, html, data) => {
  // Recherche les dés affichés dans le message du chat
  const diceTotal = html.find(".dice-total");
  const diceRolls = html.find(".d100");
  const diceEc = html.find(".ec");
  const diceRc = html.find(".rc");

  diceRc.each(function(){
    // Pour chaque résultat de dé, on applique la coloration au total
    diceTotal.each(function() {
      $(this).css("color", "green");
    });

    // Pour chaque résultat de dé, on applique la coloration au dé
    diceRolls.each(function() {
        $(this).addClass("max");
    });
  });

  diceEc.each(function(){
    // Pour chaque résultat de dé, on applique la coloration au total
    diceTotal.each(function() {
      $(this).css("color", "red");
    });

    // Pour chaque résultat de dé, on applique la coloration au dé
    diceRolls.each(function() {
        $(this).addClass("min");
    });
  });
});

Hooks.on("updateCombat", async (combat, updateData) => {
  if (updateData.turn === undefined) return;

  const combatant = combat.combatants.get(combat.current.combatantId);
  const actor = combatant?.actor;
  if (!actor) return;

  for (const effect of actor.effects) {

    const actions = effect.flags?.shinzo?.onTurnStart;
    if (!Array.isArray(actions) || !actions.length) continue;

    // Variables accessibles aux actions suivantes
    const context = {
      actor,
      effect,
      damage: 0
    };

    for (const action of actions) {

      switch (action.type) {

        case "damage": {

          const roll = await (new Roll(action.formula)).evaluate();

          context.damage = roll.total;

          await actor.update({
            "system.health.value": Math.max(
              0,
              actor.system.health.value - context.damage
            )
          });

          break;
        }

        case "heal": {

          const roll = await (new Roll(action.formula)).evaluate();

          context.heal = roll.total;

          await actor.update({
            "system.health.value": Math.min(
              actor.system.health.max,
              actor.system.health.value + context.heal
            )
          });

          break;
        }

        case "chat": {

          const content = action.message
            .replaceAll("{name}", actor.name)
            .replaceAll("{damage}", context.damage)
            .replaceAll("{heal}", context.heal ?? 0);

          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content
          });

          break;
        }

      }
    }
  }
});

Hooks.on("updateCombat", async (combat, update) => {
  if (update.turn === undefined) return;

  const previous = combat.combatants.get(combat.previous?.combatantId);
  const actor = previous?.actor;

  if (!actor) return;

  for (const effect of actor.effects) {

    const updates = {};

    const turns = effect.duration.turns;
    const rounds = effect.duration.rounds;

    if (turns > 0)
      updates["duration.turns"] = turns - 1;

    if (
      update.round !== undefined &&
      rounds > 0
    ) {
      updates["duration.rounds"] = rounds - 1;
    }

    const newTurns = updates["duration.turns"] ?? turns;
    const newRounds = updates["duration.rounds"] ?? rounds;

    if (
      (newTurns !== undefined && newTurns <= 0) &&
      (newRounds === undefined || newRounds <= 0)
    ) {
      await effect.delete();
      continue;
    }

    if (Object.keys(updates).length)
      await effect.update(updates);
  }
});
