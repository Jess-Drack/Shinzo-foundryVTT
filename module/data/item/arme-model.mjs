import { BaseItemModel } from "./base-item-model.mjs";

const fields = foundry.data.fields;


export class ArmeModel extends BaseItemModel {

    static defineSchema(){

        return {

            ...super.defineSchema(),

            type:new fields.StringField({initial:""}),

            polyvalence:new fields.StringField({initial:""}),

            damage:new fields.StringField({initial:""}),

            effect:new fields.StringField({initial:""}),

            quality:new fields.StringField({initial:""})

        };

    }

}