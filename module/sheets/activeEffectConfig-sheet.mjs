/**
 * Extend the basic ActiveEffectConfig with some very simple modifications
 * @extends {ActiveEffectConfig}
 */
export class ShinzoActiveEffectConfig extends ActiveEffectConfig {
  get template() {
    return "systems/shinzo/templates/activeEffectConfig-sheet.hbs";
  }

  getData() {
    const contexte = super.getData();

    contexte.config = CONFIG.SHINZO;

    return contexte;
  }
}