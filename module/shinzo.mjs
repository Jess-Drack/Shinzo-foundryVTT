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
import { ShinzoActiveEffectConfig } from "./sheets/active-effect-config-sheet.mjs";

import { CharacterModel } from "./data/actor/character-model.mjs";
import { NPCModel } from "./data/actor/npc-model.mjs";

import { ArmeModel } from "./data/item/arme-model.mjs";
import { ArmureModel } from "./data/item/armure-model.mjs";
import { ObjetModel } from "./data/item/objet-model.mjs";
import { SacModel } from "./data/item/sac-model.mjs";
import { CompetenceModel } from "./data/item/competence-model.mjs";
import { TraitModel } from "./data/item/trait-model.mjs";
import { ConsommableModel } from "./data/item/consommable-model.mjs";

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
    trait: TraitModel,
    consommable: ConsommableModel
  };

  DocumentSheetConfig.registerSheet(
    ActiveEffect,
    "shinzo",
    ShinzoActiveEffectConfig,
    {
        makeDefault: true,
        label: "SHINZO.SheetLabels.ActiveEffectConfig"
    }
  );

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

Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

// Calcule dynamiquement la longueur d'un texte pour ajuster la police
Handlebars.registerHelper('stringLength', function (str) {
  return typeof str === "string" ? str.length : 0;
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

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

async function createItemMacro(data, slot) {
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn('You can only create macro buttons for owned Items');
  }
  const item = await Item.fromDropData(data);

  const command = `game.shinzo.rollItemMacro("${data.uuid}");`;
  console.log(command)
  let macro = game.macros.find((m) => m.name === item.name && m.command === command);
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

function rollItemMacro(itemUuid) {
  const dropData = { type: 'Item', uuid: itemUuid };
  Item.fromDropData(dropData).then((item) => {
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }
    item.roll();
  });
}

/* -------------------------------------------- */
/*  CHAT & IMMERSION MODERNE V13                 */
/* -------------------------------------------- */

Hooks.on("preCreateChatMessage", (document, data, options, userId) => {
  const speaker = data.speaker;
  if (!speaker) return;

  let actor = null;
  if (speaker.token) {
    const scene = game.scenes.get(speaker.scene ?? canvas.scene?.id);
    const tokenDoc = scene?.tokens.get(speaker.token);
    actor = tokenDoc?.actor;
  }
  if (!actor && speaker.actor) {
    actor = game.actors.get(speaker.actor);
  }

  if (actor && actor.img) {
    document.updateSource({ 
      "avatar": actor.img,
      "speaker.avatar": actor.img
    });
  }
});

Hooks.on('renderChatMessageHTML', (message, element, data) => {
  const html = $(element);

  // 1. RECONSTRUCTION DU HEADER EN MODE "STACKED"
  const speaker = message.speaker;
  let imgPath = "icons/svg/mystery-man.svg"; // Fallback par défaut
  let actorUuid = "";

  if (speaker.actor) {
    const actor = game.actors.get(speaker.actor);
    if (actor) {
      imgPath = actor.img;
      actorUuid = actor.uuid;
    }
  }

  // Récupération du sous-titre (Nom du joueur ou Gamemaster)
  const user = game.users.get(message.user);
  const subtitleText = user ? (user.isGM ? "Gamemaster" : user.name) : "";
  const senderName = message.alias ?? "Mystère";

  // Ciblage de l'en-tête du message
  const header = element.querySelector(".message-header");
  const senderH4 = header?.querySelector(".message-sender");

  if (senderH4 && !senderH4.querySelector(".avatar")) {
    // Nettoyage du texte brut d'origine pour injecter la structure imbriquée
    senderH4.textContent = ""; 

    // Construction de la structure cible exacte
    const newSenderHTML = `
      <a class="avatar" data-uuid="${actorUuid}">
        <img src="${imgPath}" alt="${senderName}">
      </a>
      <span class="name-stacked">
        <span class="title">${senderName}</span>
        <span class="subtitle">${subtitleText}</span>
      </span>
    `;
    
    // Insertion propre dans le h4
    $(senderH4).append(newSenderHTML);
  }

  // 2. COLORATION ET TRAITEMENT GRAPHIQUE DES DÉS
  const diceTotal = html.find(".dice-total");
  const diceRolls = html.find(".d100");
  const diceEc = html.find(".ec");
  const diceRc = html.find(".rc");

  if (diceRc.length) {
    diceTotal.css("color", "green");
    diceRolls.addClass("max");
  }

  if (diceEc.length) {
    diceTotal.css("color", "red");
    diceRolls.addClass("min");
  }

  /**
 * Clic sur l'avatar du chat : Ouvre la fiche de l'acteur lié (Ergonomie v13)
 */
  html.on("click", "a.avatar[data-uuid]", async (ev) => {
    ev.preventDefault();
    const uuid = ev.currentTarget.dataset.uuid;
    if (!uuid) return;
    const actor = await fromUuid(uuid);
    actor?.sheet.render(true);
  });

});

/* -------------------------------------------- */
/*  COMBAT LOOPS                                */
/* -------------------------------------------- */

Hooks.on("updateCombat", async (combat, updateData) => {
  if (!game.user.isActiveGM) return;
  if (updateData.turn === undefined) return;

  const combatant = combat.combatants.get(combat.current.combatantId);
  const actor = combatant?.actor;
  if (!actor) return;

  for (const effect of actor.effects) {
    const actions = effect.flags?.shinzo?.onTurnStart;
    if (!Array.isArray(actions) || !actions.length) continue;

    const context = { actor, effect, damage: 0 };

    for (const action of actions) {
      switch (action.type) {
        case "damage": {
          const roll = await (new Roll(action.formula)).evaluate();
          context.damage = roll.total;
          await actor.update({
            "system.health.value": Math.max(0, actor.system.health.value - context.damage)
          });
          break;
        }
        case "heal": {
          const roll = await (new Roll(action.formula)).evaluate();
          context.heal = roll.total;
          await actor.update({
            "system.health.value": Math.min(actor.system.health.max, actor.system.health.value + context.heal)
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
  if (!game.user.isActiveGM) return;
  if (update.turn === undefined) return;

  const previous = combat.combatants.get(combat.previous?.combatantId);
  const actor = previous?.actor;
  if (!actor) return;

  for (const effect of actor.effects) {
    let remainingTurns = effect.getFlag("shinzo", "remainingTurns");
    if (remainingTurns == null) continue;

    remainingTurns--;

    if (remainingTurns <= 0) {
      await effect.delete();
    } else {
      await effect.setFlag("shinzo", "remainingTurns", remainingTurns);
    }
  }
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
