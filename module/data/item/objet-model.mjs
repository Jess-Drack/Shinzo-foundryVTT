import { BaseItemModel } from "./base-item-model.mjs";

const fields = foundry.data.fields;


export class ObjetModel extends BaseItemModel {


    static defineSchema(){

        return {

            ...super.defineSchema(),

            quality:new fields.StringField({initial:""}),

            effect:new fields.StringField({initial:""})

        };

    }

}