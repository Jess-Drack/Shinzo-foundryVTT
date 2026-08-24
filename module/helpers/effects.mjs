import { ShinzoActiveEffectConfig } from '../sheets/active-effect-config-sheet.mjs';
/**
 * Manage Active Effect instances through an Actor or Item Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
Hooks.on("renderActiveEffectConfig", (app, html)=>{

    const selector = html.querySelector(".shinzo-effect-selector");
    const button = html.querySelector(".add-shinzo-change");


    if (!selector || !button)
        return;


    button.addEventListener("click", ()=>{


        const key = selector.value;


        if(!key)
            return;


        app.object.updateSource({

            changes:[
                ...app.object.changes,
                {
                    key:key,
                    mode:CONST.ACTIVE_EFFECT_MODES.ADD,
                    value:0
                }
            ]

        });


        app.render(false);


    });

});


export async function onManageActiveEffect(event, owner) {
  event.preventDefault();

  const button = event.currentTarget;
  const li = button.closest("li");

  const effect = li?.dataset.effectId
    ? owner.effects.get(li.dataset.effectId)
    : null;


  switch(button.dataset.action) {

    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [{
        name: game.i18n.localize("DOCUMENT.New"),
        img: "icons/svg/aura.svg",
        origin: owner.uuid,
        disabled: li?.dataset.effectType === "inactive",
        flags: {
          shinzo: {
            remainingTurns: li?.dataset.effectType === "temporary"
              ? 1
              : null
          }
        }
    }]);


    case "edit":
      if(effect) {
        return new ShinzoActiveEffectConfig({
          document: effect
        }).render(true);
      }
      break;


    case "delete":

      if(!effect) return;

      return Dialog.confirm({
          title: "Confirmation",
          content: `<p>Êtes-vous sûr de vouloir supprimer ${effect.name} ?</p>`,
          yes: async () => {
              await effect.delete();
              ui.notifications.info(`${effect.name} supprimé.`);
          }
      });


    case "toggle":
      if(effect)
        return effect.update({
          disabled: !effect.disabled
        });

  }
}

/**
 * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
 * @param {ActiveEffect[]} effects    A collection or generator of Active Effect documents to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects){

 const categories = {

  temporary:{
    type:"temporary",
    label:game.i18n.localize("SHINZO.Effect.Temporary"),
    effects:[]
  },

  passive:{
    type:"passive",
    label:game.i18n.localize("SHINZO.Effect.Passive"),
    effects:[]
  },

  inactive:{
    type:"inactive",
    label:game.i18n.localize("SHINZO.Effect.Inactive"),
    effects:[]
  }

 };


  for(const effect of effects){

    const remainingTurns = effect.getFlag("shinzo", "remainingTurns");

    effect.displayDuration = remainingTurns != null
    ? `${remainingTurns} tour(s)`
    : null;

    if(effect.disabled){
      categories.inactive.effects.push(effect);
    }
    else if (
      remainingTurns != null ||
      effect.duration?.rounds ||
      effect.duration?.turns ||
      effect.duration?.seconds ||
      effect.duration?.startTime
    ) {
      categories.temporary.effects.push(effect);
    }
    else {
      categories.passive.effects.push(effect);
    }

  }

 return categories;

}

export function registerCustomEffects(){
  const effects = [
    {
      id: "aggripe",
      name: "Aggripé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/aggripe.svg",
      statuses:["aggripe"]
    },
    {
      id: "alourdi",
      name: "Alourdi",
      img: "systems/shinzo/assets/icons/alteration/nefaste/alourdi.svg",
      statuses:["alourdi"]
    },
    {
      id: "anti-magie",
      name: "Anti-magie",
      img: "systems/shinzo/assets/icons/alteration/nefaste/anti-magie.webp",
      statuses:["anti-magie"]
    },
    {
      id: "porteDeLaMort",
      name: "Aux portes de la mort",
      img: "systems/shinzo/assets/icons/alteration/nefaste/aux-portes-de-la-mort.png",
      statuses:["porteDeLaMort"],
      flags: {
        shinzo: {
          remainingTurns: 1
        }
      },
      changes: [
        { key: "system.gds_stats.con.b_m", mode: 2, value: -20},
        { key: "system.gds_stats.agi.b_m", mode: 2, value: -20},
        { key: "system.gds_stats.men.b_m", mode: 2, value: -20},
        { key: "system.gds_stats.mag.b_m", mode: 2, value: -20},
        { key: "system.gds_stats.cha.b_m", mode: 2, value: -20},
        { key: "system.gds_stats.sav.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.pug.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.cac.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.pre.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.esq.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.par.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.dis.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.obs.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.per.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.psy.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats1.int.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.com.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.aut.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.med.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.pil.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.art.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.vit.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.ins.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.s_f.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.reg.b_m", mode: 2, value: -20},
        { key: "system.ss_stats.ss_stats2.rec.b_m", mode: 2, value: -20},
      ],
    },
    {
      id: "aveugle",
      name: "Aveuglé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/aveugle.svg",
      statuses:["aveugle"]
    },
    {
      id: "boiteux",
      name: "Boiteux",
      img: "systems/shinzo/assets/icons/alteration/nefaste/boiteux.svg",
      statuses:["boiteux"]
    },
    {
      id: "charme",
      name: "Charmé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/charme.svg",
      statuses:["charme"]
    },
    {
      id: "chute",
      name: "Chute",
      img: "systems/shinzo/assets/icons/alteration/nefaste/chute.svg",
      statuses:["chute"]
    },
    {
      id: "confusion",
      name: "Confusion",
      img: "systems/shinzo/assets/icons/alteration/nefaste/confus.svg",
      statuses:["confusion"]
    },
    {
      id: "desequilibre",
      name: "Déséquilibré",
      img: "systems/shinzo/assets/icons/alteration/nefaste/desequilibre.svg",
      statuses:["desquilibre"]
    },
    {
      id: "distrait",
      name: "Distrait",
      img: "systems/shinzo/assets/icons/alteration/nefaste/distrait.svg",
      statuses:["distrait"],
      changes: [
        { key: "system.ss_stats.ss_stats1.obs.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.per.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.ins.b_m", mode: 2, value: -15}
      ]
    },
    {
      id: "effraye",
      name: "Effrayé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/effraye.svg",
      statuses:["effraye"]
    },
    {
      id: "electrise",
      name: "Electrisé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/electrise.svg",
      statuses:["electrise"],
      flags: {
        shinzo: {
          onTurnStart: [
            {
              type: "damage",
              formula: "1d2",
              damageType: "electric"
            },
            {
              type: "chat",
              message: "{name} subit {damage} dégâts à cause de l'altération Electrisé !"
            }
          ]
        }
      }
    },
    {
      id: "empoisonne",
      name: "Empoisonné",
      img: "systems/shinzo/assets/icons/alteration/nefaste/empoisonne.svg",
      statuses:["empoisonne"],
      flags: {
        shinzo: {
          onTurnStart: [
            {
              type: "damage",
              formula: "1d6",
              damageType: "poison"
            },
            {
              type: "chat",
              message: "{name} subit {damage} dégâts de poison."
            }
          ]
        }
      }
    },
    {
      id: "enchevetre",
      name: "Enchevêtré",
      img: "systems/shinzo/assets/icons/alteration/nefaste/enchevetre.svg",
      statuses:["enchevetre"]
    },
    {
      id: "enflamme",
      name: "Enflammé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/enflamme.svg",
      statuses:["enflamme"],
      flags: {
        shinzo: {
          onTurnStart: [
            {
              type: "damage",
              formula: "1d2",
              damageType: "feu"
            },
            {
              type: "chat",
              message: "{name} subit {damage} dégâts à cause de l'altération Enflammé !"
            }
          ]
        }
      }
    },
    {
      id: "epuise",
      name: "Epuisé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/epuise.svg",
      statuses:["epuise"],
      changes: [
        { key: "system.gds_stats.con.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.agi.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.men.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.mag.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.cha.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.sav.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.pug.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.cac.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.pre.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.esq.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.par.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.dis.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.obs.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.per.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.psy.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.int.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.com.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.aut.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.med.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.pil.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.art.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.vit.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.ins.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.s_f.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.reg.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.rec.b_m", mode: 2, value: -15},
      ]
    },
    {
      id: "etourdis",
      name: "Etourdis",
      img: "systems/shinzo/assets/icons/alteration/nefaste/etourdis.svg",
      statuses:["etourdis"],
      flags: {
        shinzo: {
          remainingTurns: 1
        }
      },
      changes: [
        { key: "system.gds_stats.con.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.agi.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.men.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.mag.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.cha.b_m", mode: 2, value: -15},
        { key: "system.gds_stats.sav.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.pug.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.cac.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.pre.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.esq.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.par.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.dis.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.obs.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.per.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.psy.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.int.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.com.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.aut.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.med.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.pil.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.art.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.vit.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.ins.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.s_f.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.reg.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.rec.b_m", mode: 2, value: -15},
      ]
    },
    {
      id: "faible",
      name: "Faible",
      img: "systems/shinzo/assets/icons/alteration/nefaste/faible.svg",
      statuses:["faible"]
    },
    {
      id: "fissure",
      name: "Fissure",
      img: "systems/shinzo/assets/icons/alteration/nefaste/fissure.svg",
      statuses:["fissure"]
    },
    {
      id: "gelure",
      name: "Gelure",
      img: "systems/shinzo/assets/icons/alteration/nefaste/gelure.svg",
      statuses:["gelure"],
      flags: {
        shinzo: {
          onTurnStart: [
            {
              type: "damage",
              formula: "1d2",
              damageType: "froid"
            },
            {
              type: "chat",
              message: "{name} subit {damage} dégâts à cause de l'altération Gelure !"
            }
          ]
        }
      }
    },
    {
      id: "hebete",
      name: "Hébété",
      img: "systems/shinzo/assets/icons/alteration/nefaste/hebete.svg",
      statuses:["hebete"],
      flags: {
        shinzo: {
          remainingTurns: 1
        }
      },
      changes: [
        { key: "system.gds_stats.con.b_m", mode: 2, value: -30},
        { key: "system.gds_stats.agi.b_m", mode: 2, value: -30},
        { key: "system.gds_stats.men.b_m", mode: 2, value: -30},
        { key: "system.gds_stats.mag.b_m", mode: 2, value: -30},
        { key: "system.gds_stats.cha.b_m", mode: 2, value: -30},
        { key: "system.gds_stats.sav.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.pug.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.cac.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.pre.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.esq.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.par.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.dis.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.obs.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.per.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.psy.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats1.int.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.com.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.aut.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.med.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.pil.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.art.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.vit.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.ins.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.s_f.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.reg.b_m", mode: 2, value: -30},
        { key: "system.ss_stats.ss_stats2.rec.b_m", mode: 2, value: -30},
      ]
    },
    {
      id: "hemorragie",
      name: "Hémorragie",
      img: "systems/shinzo/assets/icons/alteration/nefaste/hemorragie.svg",
      statuses:["hemorragie"],
      flags: {
        shinzo: {
          onTurnStart: [
            {
              type: "damage",
              formula: "1d2",
            },
            {
              type: "chat",
              message: "{name} saigne abondamment et subit {damage} points de dégâts !"
            }
          ]
        }
      }
    },
    {
      id: "hypnotise",
      name: "Hypnotisé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/hypnotise.svg",
      statuses:["hypnotise"]
    },
    {
      id: "lenteur",
      name: "Lenteur",
      img: "systems/shinzo/assets/icons/alteration/nefaste/lenteur.svg",
      statuses:["lenteur"]
    },
    {
      id: "lethargique",
      name: "Léthargique",
      img: "systems/shinzo/assets/icons/alteration/nefaste/lethargique.svg",
      statuses:["lethargique"]
    },
    {
      id: "necrose",
      name: "Nécrosé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/necrose.svg",
      statuses:["necrose"]
    },
    {
      id: "paralyse",
      name: "Paralysé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/paralyse.svg",
      statuses:["paralyse"]
    },
    {
      id: "petrifie",
      name: "Pétrifié",
      img: "systems/shinzo/assets/icons/alteration/nefaste/petrifie.svg",
      statuses:["petrifie"]
    },
    {
      id: "saignement",
      name: "Saignement",
      img: "systems/shinzo/assets/icons/alteration/nefaste/saignement.svg",
      flags: {
        shinzo: {
          onTurnStart: [
            {
              type: "damage",
              formula: "1d2",
            },
            {
              type: "chat",
              message: "{name} saigne et subit {damage} points de dégâts !"
            }
          ],
          remainingTurns: 3
        }
      },
      statuses:["saignement"]
    },
    {
      id: "saignement2",
      name: "Saignement : 2nd stack",
      img: "systems/shinzo/assets/icons/alteration/nefaste/saignement2.svg",
      statuses:["saignement2"],
      flags: {
        shinzo: {
          onTurnStart: [
            {
              type: "damage",
              formula: "1d2",
            },
            {
              type: "chat",
              message: "{name} saigne un peu plus et subit {damage} points de dégâts supplémentaires !"
            }
          ],
          remainingTurns: 3
        }
      },
    },
    {
      id: "adrenaline",
      name: "Adrénaline",
      img: "systems/shinzo/assets/icons/alteration/benefique/adrenaline.svg",
      statuses:["adrenaline"],
      flags: {
        shinzo: {
          remainingTurns: 1
        }
      },
      changes: [
        { key: "system.gds_stats.con.b_m", mode: 2, value: 20},
        { key: "system.gds_stats.agi.b_m", mode: 2, value: 20},
        { key: "system.gds_stats.men.b_m", mode: 2, value: 20},
        { key: "system.gds_stats.mag.b_m", mode: 2, value: 20},
        { key: "system.gds_stats.cha.b_m", mode: 2, value: 20},
        { key: "system.gds_stats.sav.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.pug.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.cac.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.pre.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.esq.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.par.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.dis.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.obs.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.per.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.psy.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats1.int.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.com.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.aut.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.med.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.pil.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.art.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.vit.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.ins.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.s_f.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.reg.b_m", mode: 2, value: 20},
        { key: "system.ss_stats.ss_stats2.rec.b_m", mode: 2, value: 20},
      ]
    },
    {
      id: "apaise",
      name: "Apaisé",
      img: "systems/shinzo/assets/icons/alteration/benefique/apaise.svg",
      statuses:["apaise"]
    },
    {
      id: "armure",
      name: "Armure",
      img: "systems/shinzo/assets/icons/alteration/benefique/armure.svg",
      statuses:["armure"]
    },
    {
      id: "barriere",
      name: "Barrière",
      img: "systems/shinzo/assets/icons/alteration/benefique/barriere.svg",
      statuses:["barriere"]
    },
    {
      id: "celerite",
      name: "Célérité",
      img: "systems/shinzo/assets/icons/alteration/benefique/celerite.svg",
      statuses:["celerite"]
    },
    {
      id: "concentration",
      name: "Concentration",
      img: "systems/shinzo/assets/icons/alteration/benefique/concentration.svg",
      statuses:["concentration"]
    },
    {
      id: "contre",
      name: "Contre",
      img: "systems/shinzo/assets/icons/alteration/benefique/contre.svg",
      statuses:["contre"]
    },
    {
      id: "frenetique",
      name: "Frénétique",
      img: "systems/shinzo/assets/icons/alteration/benefique/frenetique.svg",
      statuses:["frenetique"],
      changes: [
        { key: "system.rdp.deg_physique.b_m", mode: 2, value: 2},
      ]
    },
    {
      id: "immunite",
      name: "Immunisé",
      img: "systems/shinzo/assets/icons/alteration/benefique/immunite.svg",
      statuses:["immunite"]
    },
    {
      id: "invisible",
      name: "Invisible",
      img: "systems/shinzo/assets/icons/alteration/benefique/invisible.svg",
      statuses:["invisible"]
    },
    {
      id: "levitation",
      name: "Lévitation",
      img: "systems/shinzo/assets/icons/alteration/benefique/levitation.svg",
      statuses:["levitation"]
    },
    {
      id: "masque",
      name: "Masqué",
      img: "systems/shinzo/assets/icons/alteration/benefique/masque.svg",
      statuses:["masque"]
    },
    {
      id: "miroir",
      name: "Miroir",
      img: "systems/shinzo/assets/icons/alteration/benefique/miroir.svg",
      statuses:["miroir"]
    },
    {
      id: "omniscience",
      name: "Omniscience",
      img: "systems/shinzo/assets/icons/alteration/benefique/omniscience.svg",
      statuses:["omnisciense"]
    },
    {
      id: "prepare",
      name: "Préparé",
      img: "systems/shinzo/assets/icons/alteration/benefique/prepare.svg",
      statuses:["prepare"]
    },
    {
      id: "reflet",
      name: "Reflet",
      img: "systems/shinzo/assets/icons/alteration/benefique/reflet.svg",
      statuses:["reflet"]
    },
    {
      id: "regeneration",
      name: "Régénération",
      img: "systems/shinzo/assets/icons/alteration/benefique/regeneration.svg",
      statuses:["regeneration"]
    },
    {
      id: "sens",
      name: "Sens-accrus",
      img: "systems/shinzo/assets/icons/alteration/benefique/sens.svg",
      statuses:["sens"],
      changes: [
        { key: "system.ss_stats.ss_stats1.obs.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats1.per.b_m", mode: 2, value: -15},
        { key: "system.ss_stats.ss_stats2.ins.b_m", mode: 2, value: -15}
      ]
    },
    {
      id: "vision",
      name: "Vision",
      img: "systems/shinzo/assets/icons/alteration/benefique/vision.svg",
      statuses:["vision"]
    },
    {
      id: "endormis",
      name: "Endormis",
      img: "systems/shinzo/assets/icons/alteration/autre/endormis.svg",
      statuses:["endormis"]
    },
    {
      id: "surpris",
      name: "Surpris",
      img: "systems/shinzo/assets/icons/alteration/autre/surpris.svg",
      statuses:["surpris"]
    },
    {
      id: "inconscient",
      name: "Inconscient",
      img: "systems/shinzo/assets/icons/alteration/autre/inconscient.svg",
      statuses:["inconscient"]
    },
    {
      id: "mort",
      name: "Mort",
      img: "systems/shinzo/assets/icons/alteration/autre/mort.svg",
      statuses:["mort"]
    }
  ];

  CONFIG.statusEffects = [
    ...effects
  ];

}
