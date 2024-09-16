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
