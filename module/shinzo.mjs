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

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
  registerCustomEffects();
});

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
  if (game.user.isGM && updateData.turn !== undefined) {
    const currentCombatant = combat.combatants.get(combat.current.combatantId);
    const actor = currentCombatant.actor;

    const isElectrise = actor.effects.find(effet => effet.name === "Electrisé");
    const isEnflamme = actor.effects.find(effet => effet.name === "Enflammé");
    const isGele = actor.effects.find(effet => effet.name === "Gelure");
    const isHemorragie = actor.effects.find(effet => effet.name === "Hémorragie");
    const isBleeding = actor.effects.find(effet => effet.name === "Saignement");
    const isBeaucoupBleeding = actor.effects.find(effet => effet.name === "Saignement : 2nd stack")

    if (isElectrise) {
      const damageRoll = new Roll("1d2");
      await damageRoll.evaluate();
      const damage = damageRoll.total;

      let actualHealth = actor.system.health.value;

      await actor.update({ "system.health.value": actualHealth - damage });

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `${actor.name} subit ${damage} dégâts à cause de l'altération Electrisé !`
      });
    }
    if (isEnflamme) {
      const damageRoll = new Roll("1d4");
      await damageRoll.evaluate();
      const damage = damageRoll.total;

      let actualHealth = actor.system.health.value;

      await actor.update({ "system.health.value": actualHealth - damage });

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `${actor.name} subit ${damage} dégâts à cause de l'altération Enflammé !`
      });
    } 
    if (isGele) {
      const damageRoll = new Roll("1d4");
      await damageRoll.evaluate();
      const damage = damageRoll.total;

      let actualHealth = actor.system.health.value;

      await actor.update({ "system.health.value": actualHealth - damage });

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `${actor.name} subit ${damage} dégâts à cause de l'altération Gelure !`
      });
    } 
    if (isBleeding) {
      const damageRoll = new Roll("1d2");
      await damageRoll.evaluate();
      const damage = damageRoll.total;

      let actualHealth = actor.system.health.value;

      await actor.update({ "system.health.value": actualHealth - damage });

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `${actor.name} saigne et subit ${damage} points de dégâts !`
      })
    } 
    if (isBeaucoupBleeding) {
      const damageRoll = new Roll("1d2");
      await damageRoll.evaluate();
      const damage = damageRoll.total;

      let actualHealth = actor.system.health.value;

      await actor.update({ "system.health.value": actualHealth - damage });

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `${actor.name} saigne un peu plus et subit ${damage} points de dégâts supplémentaires !`
      })
    } 
    if (isHemorragie) {
      const damageRoll = new Roll("1d4");
      await damageRoll.evaluate();
      const damage = damageRoll.total;

      let actualHealth = actor.system.health.value;

      await actor.update({ "system.health.value": actualHealth - damage });

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `${actor.name} saigne abondamment et subit ${damage} points de dégâts !`
      })
    } else {
      null;
    }
  }
});

Hooks.on('updateCombat', async (combat, update, diff) => {
  if (update.turn !== undefined) {
    const previousCombatant = combat.combatants.get(combat.previous?.combatantId);
    const actor = previousCombatant?.actor;

    if (actor && actor.effects) {
      for (let effect of actor.effects) {
        let duration = effect.duration;
        
        if (duration.turns > 0) {
          await effect.update({ "duration.turns": duration.turns - 1 });
          
          if (duration.turns - 1 === 0) {
            await effect.delete();
          }
        }

        if (duration.rounds > 0 && update.round !== undefined) {
          await effect.update({ "duration.rounds": duration.rounds - 1 });

          if (duration.rounds - 1 === 0 && duration.turns === 0) {
            await effect.delete();
          }
        }
      }
    }
  }
  if (update.round !== undefined) {
    for (let combatant of combat.combatants) {
      const actor = combatant.actor;

      // Vérifie si l'acteur a des effets actifs
      if (actor && actor.effects) {
        for (let effect of actor.effects) {
          let duration = effect.duration;

          // Vérifie si l'effet a une durée en rounds spécifiée
          if (duration.rounds > 0) {
            // Réduit la durée en rounds de l'effet
            await effect.update({ "duration.rounds": duration.rounds - 1 });

            // Supprime l'effet si la durée en rounds est écoulée
            if (duration.rounds - 1 === 0 && duration.turns === 0) {
              await effect.delete();
            }
          }
        }
      }
    }
  }
});

