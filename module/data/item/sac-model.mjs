import { BaseItemModel } from "./base-item-model.mjs";

const fields = foundry.data.fields;


export class SacModel extends BaseItemModel {


static defineSchema(){


return {

...super.defineSchema(),


poidsMax:new fields.NumberField({

initial:1

}),


effect:new fields.StringField({

initial:""

}),


quality:new fields.StringField({

initial:""

}),


/**
 * UUID des objets contenus
 */
content:new fields.ArrayField(

new fields.ObjectField(),

{
initial:[]
}

)


};


}


}