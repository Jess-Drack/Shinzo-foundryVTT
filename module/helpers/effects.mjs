import { ShinzoActiveEffectConfig } from '../sheets/activeEffectConfig-sheet.mjs';
/**
 * Manage Active Effect instances through an Actor or Item Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest('li');
  const effect = li.dataset.effectId
    ? owner.effects.get(li.dataset.effectId)
    : null;
  switch (a.dataset.action) {
    case 'create':
      return owner.createEmbeddedDocuments('ActiveEffect', [
        {
          name: game.i18n.format('DOCUMENT.New', {
            type: game.i18n.localize('DOCUMENT.ActiveEffect'),
          }),
          img: 'icons/svg/aura.svg',
          origin: owner.uuid,
          'duration.rounds':
            li.dataset.effectType === 'temporary' ? 1 : undefined,
          disabled: li.dataset.effectType === 'inactive',
        },
      ]);
    case 'edit':
      if(effect){
        const effectConfig = new ShinzoActiveEffectConfig(effect);
        return effectConfig.render(true);
      } break;
    case 'delete':
      console.log("Oui je passe ici");
      new Dialog({
        title: "Confirmation",
        content: `<p>Êtes-vous sûr de vouloir supprimer ${effect.name} ?</p>`,
        buttons: {
          yes: {
            label: "Oui",
            callback: async () => {
              // Vérifier que l'effet existe encore avant de le supprimer
              if (effect) {
                ui.notifications.info(`${effect.name} supprimé.`);
                await effect.delete();
              }
            }
          },
          no: {
            label: "Non",
            callback: () => {}
          }
        },
        default: "no"
      }).render(true);
      break;
    case 'toggle':
      return effect.update({ disabled: !effect.disabled });
  }
}

/**
 * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
 * @param {ActiveEffect[]} effects    A collection or generator of Active Effect documents to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: 'temporary',
      label: game.i18n.localize('SHINZO.Effect.Temporary'),
      effects: [],
    },
    passive: {
      type: 'passive',
      label: game.i18n.localize('SHINZO.Effect.Passive'),
      effects: [],
    },
    inactive: {
      type: 'inactive',
      label: game.i18n.localize('SHINZO.Effect.Inactive'),
      effects: [],
    },
  };

  // Iterate over active effects, classifying them into categories
  for (let e of effects) {
    if (e.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }
  return categories;
}

export function registerCustomEffects(){
  CONFIG.statusEffects = [
    {
      id: "aggripe",
      name: "Aggripé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/aggripe.svg",
    },
    {
      id: "alourdi",
      name: "Alourdi",
      img: "systems/shinzo/assets/icons/alteration/nefaste/alourdi.svg",
    },
    {
      id: "anti-magie",
      name: "Anti-magie",
      img: "systems/shinzo/assets/icons/alteration/nefaste/anti-magie.webp",
    },
    {
      id: "porteDeLaMort",
      name: "Aux portes de la mort",
      img: "systems/shinzo/assets/icons/alteration/nefaste/aux-portes-de-la-mort.png",
    },
    {
      id: "aveugle",
      name: "Aveuglé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/aveugle.svg",
    },
    {
      id: "boiteux",
      name: "Boiteux",
      img: "systems/shinzo/assets/icons/alteration/nefaste/boiteux.svg",
    },
    {
      id: "charme",
      name: "Charmé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/charme.svg",
    },
    {
      id: "chute",
      name: "Chute",
      img: "systems/shinzo/assets/icons/alteration/nefaste/chute.svg",
    },
    {
      id: "confusion",
      name: "Confusion",
      img: "systems/shinzo/assets/icons/alteration/nefaste/confus.svg",
    },
    {
      id: "desequilibre",
      name: "Déséquilibré",
      img: "systems/shinzo/assets/icons/alteration/nefaste/desequilibre.svg",
    },
    {
      id: "distrait",
      name: "Distrait",
      img: "systems/shinzo/assets/icons/alteration/nefaste/distrait.svg",
    },
    {
      id: "effraye",
      name: "Effrayé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/effraye.svg",
    },
    {
      id: "electrise",
      name: "Electrisé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/electrise.svg",
    },
    {
      id: "empoisonne",
      name: "Empoisonné",
      img: "systems/shinzo/assets/icons/alteration/nefaste/empoisonne.svg",
    },
    {
      id: "enchevetre",
      name: "Enchevêtré",
      img: "systems/shinzo/assets/icons/alteration/nefaste/enchevetre.svg",
    },
    {
      id: "enflamme",
      name: "Enflammé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/enflamme.svg",
    },
    {
      id: "epuise",
      name: "Epuisé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/epuise.svg",
    },
    {
      id: "etourdis",
      name: "Etourdis",
      img: "systems/shinzo/assets/icons/alteration/nefaste/etourdis.svg",
    },
    {
      id: "faible",
      name: "Faible",
      img: "systems/shinzo/assets/icons/alteration/nefaste/faible.svg",
    },
    {
      id: "fissure",
      name: "Fissure",
      img: "systems/shinzo/assets/icons/alteration/nefaste/fissure.svg",
    },
    {
      id: "gelure",
      name: "Gelure",
      img: "systems/shinzo/assets/icons/alteration/nefaste/gelure.svg",
    },
    {
      id: "hebete",
      name: "Hébété",
      img: "systems/shinzo/assets/icons/alteration/nefaste/hebete.svg",
    },
    {
      id: "hemorragie",
      name: "Hémorragie",
      img: "systems/shinzo/assets/icons/alteration/nefaste/hemorragie.svg",
    },
    {
      id: "hypnotise",
      name: "Hypnotisé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/hypnotise.svg",
    },
    {
      id: "lenteur",
      name: "Lenteur",
      img: "systems/shinzo/assets/icons/alteration/nefaste/lenteur.svg",
    },
    {
      id: "lethargique",
      name: "Léthargique",
      img: "systems/shinzo/assets/icons/alteration/nefaste/lethargique.svg",
    },
    {
      id: "necrose",
      name: "Nécrosé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/necrose.svg",
    },
    {
      id: "paralyse",
      name: "Paralysé",
      img: "systems/shinzo/assets/icons/alteration/nefaste/paralyse.svg",
    },
    {
      id: "petrifie",
      name: "Pétrifié",
      img: "systems/shinzo/assets/icons/alteration/nefaste/petrifie.svg",
    },
    {
      id: "saignement",
      name: "Saignement",
      img: "systems/shinzo/assets/icons/alteration/nefaste/saignement.svg",
    },
    {
      id: "saignement2",
      name: "Saignement : 2nd stack",
      img: "systems/shinzo/assets/icons/alteration/nefaste/saignement2.svg",
    },
    {
      id: "adrenaline",
      name: "Adrénaline",
      img: "systems/shinzo/assets/icons/alteration/benefique/adrenaline.svg",
    },
    {
      id: "apaise",
      name: "Apaisé",
      img: "systems/shinzo/assets/icons/alteration/benefique/apaise.svg",
    },
    {
      id: "armure",
      name: "Armure",
      img: "systems/shinzo/assets/icons/alteration/benefique/armure.svg",
    },
    {
      id: "barriere",
      name: "Barrière",
      img: "systems/shinzo/assets/icons/alteration/benefique/barriere.svg",
    },
    {
      id: "celerite",
      name: "Célérité",
      img: "systems/shinzo/assets/icons/alteration/benefique/celerite.svg",
    },
    {
      id: "concentration",
      name: "Concentration",
      img: "systems/shinzo/assets/icons/alteration/benefique/concentration.svg",
    },
    {
      id: "contre",
      name: "Contre",
      img: "systems/shinzo/assets/icons/alteration/benefique/contre.svg",
    },
    {
      id: "frenetique",
      name: "Frénétique",
      img: "systems/shinzo/assets/icons/alteration/benefique/frenetique.svg",
    },
    {
      id: "immunite",
      name: "Immunisé",
      img: "systems/shinzo/assets/icons/alteration/benefique/immunite.svg",
    },
    {
      id: "invisible",
      name: "Invisible",
      img: "systems/shinzo/assets/icons/alteration/benefique/invisible.svg",
    },
    {
      id: "levitation",
      name: "Lévitation",
      img: "systems/shinzo/assets/icons/alteration/benefique/levitation.svg",
    },
    {
      id: "masque",
      name: "Masqué",
      img: "systems/shinzo/assets/icons/alteration/benefique/masque.svg",
    },
    {
      id: "miroir",
      name: "Miroir",
      img: "systems/shinzo/assets/icons/alteration/benefique/miroir.svg",
    },
    {
      id: "omniscience",
      name: "Omniscience",
      img: "systems/shinzo/assets/icons/alteration/benefique/omniscience.svg",
    },
    {
      id: "prepare",
      name: "Préparé",
      img: "systems/shinzo/assets/icons/alteration/benefique/prepare.svg",
    },
    {
      id: "reflet",
      name: "Reflet",
      img: "systems/shinzo/assets/icons/alteration/benefique/reflet.svg",
    },
    {
      id: "regeneration",
      name: "Régénération",
      img: "systems/shinzo/assets/icons/alteration/benefique/regeneration.svg",
    },
    {
      id: "sens",
      name: "Sens-accrus",
      img: "systems/shinzo/assets/icons/alteration/benefique/sens.svg",
    },
    {
      id: "vision",
      name: "Vision",
      img: "systems/shinzo/assets/icons/alteration/benefique/vision.svg",
    },
    {
      id: "endormis",
      name: "Endormis",
      img: "systems/shinzo/assets/icons/alteration/autre/endormis.svg",
    },
    {
      id: "surpris",
      name: "Surpris",
      img: "systems/shinzo/assets/icons/alteration/autre/surpris.svg",
    },
    {
      id: "mort",
      name: "Mort",
      img: "systems/shinzo/assets/icons/alteration/autre/mort.svg",
    }
  ];
}
