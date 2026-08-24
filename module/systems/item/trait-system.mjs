import { prepareItemData } from "./item-system.mjs";


export function prepareTraitData(item){

    const system = prepareItemData(item);

    if(!system)
        return;

    system.effect ??= [];

}