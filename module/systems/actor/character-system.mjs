import { prepareActorData } from "./actor-system.mjs";

import { calculateSecondaryStats, calculateTotalModifiers } from "./secondary-stat-system.mjs";
import { calculateValuation } from "./valuation-system.mjs";



/**
 * Préparation des données personnage
 */
export function prepareCharacterData(actor) {
    

  const system = prepareActorData(actor);


  if (!system) return;



  const {
    ss_stats: ssStats,
    valuation,
    gds_stats: gdsStats,
    maitrises
  } = system;



  /**
   * Sous statistiques
   */
  if (
    ssStats &&
    gdsStats &&
    maitrises
  ) {

    calculateSecondaryStats(
      gdsStats,
      maitrises,
      ssStats
    );

  }



  /**
   * Valeur globale personnage
   */
  if (valuation && ssStats) {

    valuation.value =
      calculateValuation(ssStats);

  }



  /**
   * Total des modificateurs
   */
  if (ssStats?.totalmod) {

    ssStats.totalmod.value =
      calculateTotalModifiers(ssStats);

  }


}