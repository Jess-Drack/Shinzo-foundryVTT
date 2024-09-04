/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/shinzo/templates/actor/parts/actor-traits.hbs',
    'systems/shinzo/templates/actor/parts/actor-items.hbs',
    'systems/shinzo/templates/actor/parts/actor-competences.hbs',
    'systems/shinzo/templates/actor/parts/actor-effects.hbs',
    'systems/shinzo/templates/actor/parts/actor-stats.hbs',
    'systems/shinzo/templates/actor/parts/actor-description.hbs',
    // NPC partials
    'systems/shinzo/templates/actor/parts/actor-npc-items.hbs',
    // Item partials
    'systems/shinzo/templates/item/parts/item-effects.hbs',
    // ActiveEffectConfig
    'systems/shinzo/templates/activeEffect-config.hbs',
    'systems/shinzo/templates/activeEffect-list.hbs'
  ]);
};
