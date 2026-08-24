const fields = foundry.data.fields;

/* -------------------------------------------- */
/* Helpers                                      */
/* -------------------------------------------- */

function createResource() {
  return new fields.SchemaField({
    value: new fields.NumberField({ initial: 0 }),
    min: new fields.NumberField({ initial: -30 }),
    max: new fields.NumberField({ initial: 30 })
  });
}

export class BaseActorModel extends foundry.abstract.TypeDataModel {

  static defineSchema() {

    return {

      health: createResource(),

      power: createResource(),

      biography: new fields.HTMLField({
        initial: ""
      })

    };

  }

}