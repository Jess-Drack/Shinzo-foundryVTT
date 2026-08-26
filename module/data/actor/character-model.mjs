import { BaseActorModel } from "./base-model.mjs";

const fields = foundry.data.fields;

/* -------------------------------------------- */
/* Helpers                                      */
/* -------------------------------------------- */

function createPrimaryStat() {
  return new fields.SchemaField({
    value: new fields.NumberField({ initial: 50 }),
    brut: new fields.NumberField({ initial: 0 }),
    b_m: new fields.NumberField({ initial: 0 }),
    spe: new fields.BooleanField({ initial: false }),
    spe_check: new fields.BooleanField({ initial: false }),
    addCrit: new fields.NumberField({ initial: 0 })
  });
}

function createSecondaryStat() {
  return new fields.SchemaField({
    value: new fields.NumberField({ initial: 0 }),
    mod: new fields.NumberField({ initial: 0 }),
    b_m: new fields.NumberField({ initial: 0 }),
    spe: new fields.BooleanField({ initial: false }),
    spe_check: new fields.BooleanField({ initial: false }),
    addCrit: new fields.NumberField({ initial: 0 })
  });
}

function createMastery() {
  return new fields.SchemaField({
    value: new fields.NumberField({ initial: 0 }),
    b_m: new fields.NumberField({ initial: 0 })
  });
}

function createRdp() {
  return new fields.SchemaField({
    value: new fields.NumberField({ initial: 0 }),
    b_m: new fields.NumberField({ initial: 0 })
  });
}

/* -------------------------------------------- */

export class CharacterModel extends BaseActorModel {

  static defineSchema() {

    return {

      ...super.defineSchema(),

      description1: new fields.SchemaField({
        age: new fields.StringField(),
        genre: new fields.StringField(),
        taille: new fields.StringField(),
        poids: new fields.StringField()
      }),

      description2: new fields.SchemaField({
        race: new fields.StringField(),
        classe: new fields.StringField(),
        metier: new fields.StringField(),
        loisir: new fields.StringField()
      }),

      valuation: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 })
      }),

      rdp: new fields.SchemaField({
        deg_physique: createRdp(),
        res_physique: createRdp()
      }),

      rdm: new fields.SchemaField({
        deg_magique: createRdp(),
        res_magique: createRdp()
      }),

      gds_stats: new fields.SchemaField({

        con: createPrimaryStat(),
        agi: createPrimaryStat(),
        men: createPrimaryStat(),
        mag: createPrimaryStat(),
        cha: createPrimaryStat(),
        sav: createPrimaryStat()

      }),

      gds_statsTotal: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 })
      }),

      maitrises: new fields.SchemaField({

        cor: createMastery(),
        esp: createMastery(),
        soc: createMastery()

      }),

      ss_stats: new fields.SchemaField({

        ss_stats1: new fields.SchemaField({

          pug: createSecondaryStat(),
          cac: createSecondaryStat(),
          pre: createSecondaryStat(),
          esq: createSecondaryStat(),
          par: createSecondaryStat(),
          dis: createSecondaryStat(),
          obs: createSecondaryStat(),
          per: createSecondaryStat(),
          psy: createSecondaryStat(),
          int: createSecondaryStat()

        }),

        ss_stats2: new fields.SchemaField({

          com: createSecondaryStat(),
          aut: createSecondaryStat(),
          med: createSecondaryStat(),
          pil: createSecondaryStat(),
          art: createSecondaryStat(),
          vit: createSecondaryStat(),
          ins: createSecondaryStat(),
          s_f: createSecondaryStat(),
          reg: createSecondaryStat(),
          rec: createSecondaryStat()

        }),

        totalmod: new fields.SchemaField({
          value: new fields.NumberField({ initial: 0 })
        })

      }),

      note: new fields.StringField(),

      color: new fields.ColorField({initial: "#ffffff"}),

      devise: new fields.SchemaField({

        or: new fields.SchemaField({
          value: new fields.NumberField({ initial: 0 })
        }),

        argent: new fields.SchemaField({
          value: new fields.NumberField({ initial: 0 })
        }),

        cuivre: new fields.SchemaField({
          value: new fields.NumberField({ initial: 0 })
        })

      }),

        /**
        * Valeurs finales calculées
        *
        * Bonus équipements
        * Effets
        */
        derived: new fields.SchemaField({

        gds_stats:new fields.SchemaField({}),

        ss_stats:new fields.SchemaField({}),

        rdp:new fields.SchemaField({}),

        rdm:new fields.SchemaField({})

      })

    };

  }

}