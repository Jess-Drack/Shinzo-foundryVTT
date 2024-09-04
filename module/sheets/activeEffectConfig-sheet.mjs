/**
 * Extend the basic ActiveEffectConfig with some very simple modifications
 * @extends {ActiveEffectConfig}
 */
export class ShinzoActiveEffectConfig extends ActiveEffectConfig {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/shinzo/templates/activeEffect-config.hbs'  // Chemin vers ton modèle personnalisé
    });
  }

  getData() {
    const contexte = super.getData();

    contexte.config = CONFIG.SHINZO;
    console.log(contexte.config.activeEffectChanges);

    return contexte;
  }
}