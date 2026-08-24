import { BaseItemModel } from "./base-item-model.mjs";

const fields = foundry.data.fields;


export class CompetenceModel extends BaseItemModel {


    static defineSchema(){

        return {

            ...super.defineSchema(),

            effect:new fields.StringField({initial:""}),

            cost:new fields.StringField({initial:""}),

            note:new fields.StringField({initial:""}),

            unit:new fields.StringField({initial:""}),

            turn:new fields.StringField({initial:""})

        };

    }

}