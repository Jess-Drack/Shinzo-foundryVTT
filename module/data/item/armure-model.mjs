import { BaseItemModel } from "./base-item-model.mjs";

const fields = foundry.data.fields;


export class ArmureModel extends BaseItemModel {


static defineSchema(){


return {


...super.defineSchema(),



poids:new fields.StringField({

initial: "Négligeable"

}),



resPhysique:new fields.NumberField({

initial:0

}),



resMagique:new fields.NumberField({

initial:0

}),



effect:new fields.StringField({

initial:""

}),



quality:new fields.StringField({

initial:""

})


};


}


}