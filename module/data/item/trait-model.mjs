import { BaseItemModel } from "./base-item-model.mjs";

const fields = foundry.data.fields;


export class TraitModel extends BaseItemModel {


static defineSchema(){


return {


...super.defineSchema(),



effect:new fields.ArrayField(

    new fields.StringField(),

    {
      initial:[]
    }

),



note:new fields.StringField({

initial:""

}),



unit:new fields.StringField({

initial:""

})


};


}


}