const fields = foundry.data.fields;


export class ShinzoEffectModel 
extends foundry.abstract.TypeDataModel {


static defineSchema(){

return {


enabled:
new fields.BooleanField({
    initial:true
}),


duration:
new fields.SchemaField({

    rounds:
    new fields.NumberField({
        initial:0
    }),

    startRound:
    new fields.NumberField({
        initial:null,
        nullable:true
    })

}),


description:
new fields.StringField({
    initial:""
}),


category:
new fields.StringField({
    initial:""
})


};


}


}