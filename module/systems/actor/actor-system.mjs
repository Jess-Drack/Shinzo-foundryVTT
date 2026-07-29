import { prepareResources } from "./resource-system.mjs";

import { calculatePrimaryStats, calculateTotalPrimaryStats } from "./stat-system.mjs";
import { calculateMasteries } from "./mastery-system.mjs";
import { calculateResistance } from "./resistance-system.mjs";

import { ModifierSystem } from "./modifier-system.mjs";


export function prepareActorData(actor){


const system = actor.system;


if(!system)
return;


/*
 Ressources
*/
prepareResources(system);


/*
 Calcul des stats natives
*/
calculatePrimaryStats(
system.gds_stats
);


calculateMasteries(
system.gds_stats,
system.maitrises
);


calculateResistance(
system,
system.gds_stats
);



if(system.gds_statsTotal){

system.gds_statsTotal.value =
calculateTotalPrimaryStats(
system.gds_stats
);

}


/*
 =============================
 MODIFIERS
 =============================
*/


const modifiers =
ModifierSystem.collect(actor);


system.modifiers =
modifiers;


/*
 Reset derived
*/

system.derived = foundry.utils.deepClone({

gds_stats:
system.gds_stats,

ss_stats:
system.ss_stats,

rdp:
system.rdp,

rdm:
system.rdm

});


/*
 Application des bonus
*/

ModifierSystem.apply(
system.derived,
modifiers
);


return system;


}