import { BaseItemModel } from "./base-item-model.mjs";

const fields = foundry.data.fields;

export class ConsommableModel extends BaseItemModel {

  static defineSchema() {

    return {

      ...super.defineSchema(),

      quantity: new fields.NumberField({
        initial: 1,
        min: 0,
        integer: true
      }),

      maxQuantity: new fields.NumberField({
        initial: 99,
        min: 1,
        integer: true
      }),

      stackable: new fields.BooleanField({
        initial: true
      }),

      charges: new fields.NumberField({
        initial: 1,
        min: 0,
        integer: true
      }),

      maxCharges: new fields.NumberField({
        initial: 1,
        min: 1,
        integer: true
      }),

      consumeType: new fields.StringField({
        initial: "quantity"
      }),

      effect:new fields.HTMLField({
        initial:""
    }),

    };

  }

}