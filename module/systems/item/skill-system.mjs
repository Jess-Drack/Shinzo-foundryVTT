import { prepareItemData } from "./item-system.mjs";


export function prepareSkillData(item){

    const system = prepareItemData(item);

    if(!system)
        return;

    system.cost ??= 0;
    system.turn ??= 1;

}