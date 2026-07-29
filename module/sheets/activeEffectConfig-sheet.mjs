/**
 * Extend the basic ActiveEffectConfig with some very simple modifications
 * @extends {ActiveEffectConfig}
 */
export class ShinzoActiveEffectConfig extends ActiveEffectConfig {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["shinzo", "sheet", "active-effect"],
      template: 'systems/shinzo/templates/activeEffect-config.hbs',  // Chemin vers ton modèle personnalisé
      width: 560,
      height: "auto"
    });
  }

  async getData(options={}) {
    const contexte = await super.getData();

    contexte.config = CONFIG.SHINZO;

    return contexte;
  }
}