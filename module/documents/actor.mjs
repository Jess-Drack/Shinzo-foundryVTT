/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ShinzoActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.shinzo || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

      let valuation = systemData.valuation;
      let gds_stats = systemData.gds_stats;
      let maitrise = systemData.maitrises;
      let ss_stats = systemData.ss_stats;
      let ss_stat1 = ss_stats.ss_stats1;
      let ss_stat2 = ss_stats.ss_stats2;

      gds_stats.con.brut = Math.floor(gds_stats.con.value + gds_stats.con.b_m);
      gds_stats.agi.brut = Math.floor(gds_stats.agi.value + gds_stats.agi.b_m);
      gds_stats.cha.brut = Math.floor(gds_stats.cha.value + gds_stats.cha.b_m);
      gds_stats.sav.brut = Math.floor(gds_stats.sav.value + gds_stats.sav.b_m);
      gds_stats.mag.brut = Math.floor(gds_stats.mag.value + gds_stats.mag.b_m);
      gds_stats.men.brut = Math.floor(gds_stats.men.value + gds_stats.men.b_m);
      
      maitrise.cor.value = Math.floor((2*gds_stats.con.value + 2*gds_stats.agi.value + gds_stats.sav.value) / 5 + maitrise.cor.b_m);
      maitrise.esp.value = Math.floor((2*gds_stats.mag.value + 2*gds_stats.men.value + gds_stats.sav.value) / 5 + maitrise.esp.b_m);
      maitrise.soc.value = Math.floor((gds_stats.sav.value + 4*gds_stats.cha.value) / 5 + maitrise.soc.b_m);

      ss_stat1.pug.value = Math.floor((2*gds_stats.con.value + maitrise.cor.value) / 3 + ss_stat1.pug.mod + ss_stat1.pug.b_m);
      ss_stat1.cac.value = Math.floor((gds_stats.con.value + 2*maitrise.cor.value) / 3 + ss_stat1.cac.mod + ss_stat1.cac.b_m);
      ss_stat1.pre.value = Math.floor((maitrise.esp.value + 3*maitrise.cor.value) / 4 + ss_stat1.pre.mod + ss_stat1.pre.b_m);
      ss_stat1.esq.value = Math.floor((maitrise.cor.value + 2*gds_stats.agi.value) / 3 + ss_stat1.esq.mod + ss_stat1.esq.b_m);
      ss_stat1.par.value = Math.floor(maitrise.cor.value + ss_stat1.par.mod + ss_stat1.par.b_m);
      ss_stat1.dis.value = Math.floor((maitrise.soc.value + 2*gds_stats.agi.value) / 3 + ss_stat1.dis.mod + ss_stat1.dis.b_m);
      ss_stat1.obs.value = Math.floor((maitrise.soc.value + 3*gds_stats.men.value) / 4 + ss_stat1.obs.mod + ss_stat1.obs.b_m);
      ss_stat1.per.value = Math.floor((maitrise.esp.value + 3*gds_stats.mag.value) / 4 + ss_stat1.per.mod + ss_stat1.per.b_m);
      ss_stat1.psy.value = Math.floor((gds_stats.mag.value + gds_stats.men.value + 2*maitrise.esp.value) / 4 + ss_stat1.psy.mod + ss_stat1.psy.b_m);
      ss_stat1.int.value = Math.floor((gds_stats.con.value + 2*maitrise.soc.value) / 3 + ss_stat1.int.mod + ss_stat1.int.b_m);
      ss_stat2.com.value = Math.floor(maitrise.soc.value + ss_stat2.com.mod + ss_stat2.com.b_m);
      ss_stat2.aut.value = Math.floor((maitrise.soc.value + gds_stats.cha.value) / 2 + ss_stat2.aut.mod + ss_stat2.aut.b_m);
      ss_stat2.med.value = Math.floor((gds_stats.sav.value + maitrise.esp.value) / 2 + ss_stat2.med.mod + ss_stat2.med.b_m);
      ss_stat2.pil.value = Math.floor((maitrise.soc.value + maitrise.esp.value) / 2 + ss_stat2.pil.mod + ss_stat2.pil.b_m);
      ss_stat2.art.value = Math.floor((maitrise.soc.value + maitrise.esp.value) / 2 + ss_stat2.art.mod + ss_stat2.art.b_m);
      ss_stat2.vit.value = Math.floor((gds_stats.agi.value + maitrise.cor.value) / 2 + ss_stat2.vit.mod + ss_stat2.vit.b_m);
      ss_stat2.ins.value = Math.floor((gds_stats.men.value + maitrise.esp.value) / 2 + ss_stat2.ins.mod + ss_stat2.ins.b_m);
      ss_stat2.s_f.value = Math.floor((gds_stats.sav.value + maitrise.esp.value) / 2 + ss_stat2.s_f.mod + ss_stat2.s_f.b_m);
      ss_stat2.reg.value = Math.floor((gds_stats.con.value + maitrise.esp.value) / 2 + ss_stat2.reg.mod + ss_stat2.reg.b_m);
      ss_stat2.rec.value = Math.floor((gds_stats.mag.value + maitrise.esp.value) / 2 + ss_stat2.rec.mod + ss_stat2.rec.b_m);

      if(gds_stats.con.value >= 70){
        systemData.rdp.deg_physique.value = 1;
        systemData.rdp.res_physique.value = 1;
      }else if(gds_stats.con.value <= 30){
        systemData.rdp.deg_physique.value = -1;
        systemData.rdp.res_physique.value = -1;
      }else{
        systemData.rdp.deg_physique.value = 0;
        systemData.rdp.res_physique.value = 0;
      };

      if(gds_stats.mag.value >= 70){
        systemData.rdm.deg_magique.value = 1;
        systemData.rdm.res_magique.value = 1;
      }else if(gds_stats.mag.value <= 30){
        systemData.rdm.deg_magique.value = -1;
        systemData.rdm.res_magique.value = -1;
      }else{
        systemData.rdm.deg_magique.value = 0;
        systemData.rdm.res_magique.value = 0;
      };

      valuation.value = Math.floor(ss_stat1.pug.value + ss_stat1.cac.value + ss_stat1.pre.value + ss_stat1.esq.value + ss_stat1.par.value + ss_stat1.dis.value + ss_stat1.obs.value + ss_stat1.per.value + ss_stat1.psy.value + ss_stat1.int.value + ss_stat2.com.value + ss_stat2.aut.value + ss_stat2.med.value + ss_stat2.pil.value + ss_stat2.art.value + ss_stat2.vit.value + ss_stat2.ins.value + ss_stat2.s_f.value + ss_stat2.reg.value + ss_stat2.rec.value - 900);
      ss_stats.totalmod.value = Math.floor(ss_stat1.pug.mod + ss_stat1.cac.mod + ss_stat1.pre.mod + ss_stat1.esq.mod + ss_stat1.par.mod + ss_stat1.dis.mod + ss_stat1.obs.mod + ss_stat1.per.mod + ss_stat1.psy.mod + ss_stat1.int.mod + ss_stat2.com.mod + ss_stat2.aut.mod + ss_stat2.med.mod + ss_stat2.pil.mod + ss_stat2.art.mod + ss_stat2.vit.mod + ss_stat2.ins.mod + ss_stat2.s_f.mod + ss_stat2.reg.mod + ss_stat2.rec.mod);
      // Loop through ability scores, and add their modifiers to our sheet output.
    /*for (let [key, maitrise] of Object.entries(systemData.maitrises)) {
      // Calculate the modifier using d20 rules.
      console.log(maitrise)
      maitrise.mod = Math.floor(maitrise.value + maitrise.b_m);
      console.log(maitrise.mod)
    }*/
      // Calculate the modifier using d20 rules.
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.cr * systemData.cr * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.gds_stats) {
      for (let [k, v] of Object.entries(data.gds_stats)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    /*if (data.valuation.rating) {
      data.lvl = data.valuation.rating.value ?? 0;
    }*/
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }
}
