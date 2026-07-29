import { prepareItemData } from "./item-system.mjs";


export function prepareObjectData(item){


    const system =
        prepareItemData(item);



    if(!system)
        return;



    system.effect ??= "";

}