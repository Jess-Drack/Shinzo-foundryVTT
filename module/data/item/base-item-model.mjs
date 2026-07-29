const fields = foundry.data.fields;


/**
 * Données communes à tous les Items
 */
export class BaseItemModel extends foundry.abstract.TypeDataModel {


  static defineSchema(){


    return {


      description:new fields.HTMLField({

        initial:""

      }),



      /**
       * Item actif
       *
       * Utile pour :
       * - traits
       * - compétences
       * - objets consommables
       */
      enabled:new fields.BooleanField({

        initial:true

      }),




      /**
       * Objet équipé
       *
       * Principalement :
       * - armes
       * - armures
       * - sacs
       */
      equipped:new fields.BooleanField({

        initial:false

      }),





      modifiers:new fields.ArrayField(

        new fields.SchemaField({


          enabled:new fields.BooleanField({

            initial:true

          }),



          target:new fields.StringField({

            initial:""

          }),



          value:new fields.NumberField({

            initial:0

          }),



          mode:new fields.StringField({

            initial:"add"

          }),



          priority:new fields.NumberField({

            initial:0

          }),

          type:new fields.StringField({

            initial:"bonus"

        })


        }),


        {

          initial:[]

        }

      )


    };

  }

}