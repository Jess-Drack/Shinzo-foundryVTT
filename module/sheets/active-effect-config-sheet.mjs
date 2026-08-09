/**
 * Extend the basic ActiveEffectConfig with Shinzo modifications.
 * @extends {ActiveEffectConfig}
 */
export class ShinzoActiveEffectConfig extends ActiveEffectConfig {

    static PARTS = {
        ...super.PARTS,

        changes: {
            template:
                "systems/shinzo/templates/active-effect/changes.hbs"
        }
    };


    /**
     * Prépare le contexte de la partie "changes".
     */
    async _preparePartContext(partId, context, options) {

        context = await super._preparePartContext(
            partId,
            context,
            options
        );

        if (partId !== "changes")
            return context;

        /*
         * Définitions des Active Effects
         */
        const definitions = CONFIG.SHINZO.activeEffectChanges;

        /*
         * Catégories affichées dans le select.
         */
        const categories = {

            resources: {
                label: "Ressources",
                changes: []
            },

            stats: {
                label: "Caractéristiques",
                changes: []
            },

            maitrises: {
                label: "Maîtrises",
                changes: []
            },

            ss_stats: {
                label: "Sous stats",
                changes: []
            },

            degats_resistances: {
                label: "Dégâts & Résistances",
                changes: []
            },

            condition: {
                label: "États",
                changes: []
            }

        };

        /*
         * Remplit les catégories avec les
         * caractéristiques disponibles.
         */
        for (const [key, data] of Object.entries(definitions)) {

            const category = categories[data.category];

            if (!category)
                continue;


            category.changes.push({

                key,
                label: game.i18n.localize(data.label)

            });

        }

        /*
         * Rend les catégories disponibles
         * dans le template.
         */
        context.activeEffectChangeCategories =
            categories;

        /*
         * Version plate des choix.
         *
         * Elle peut notamment être utilisée
         * par selectOptions si nécessaire.
         */
        context.activeEffectChanges =
            Object.fromEntries(

                Object.entries(definitions)
                    .map(([key, data]) => [

                        key,

                        game.i18n.localize(
                            data.label
                        )

                    ])

            );

        /*
         * Très important :
         * on s'assure que chaque change possède
         * bien sa clé actuelle.
         *
         * Cela permet au HBS de comparer :
         *
         * change.key
         *
         * avec
         *
         * option.key
         */
        context.effectChanges =
            (context.source?.changes ?? []).map(
                change => ({
                    ...change
                })
            );


        return context;
    }

}