/**
 * Calculate character masteries
 *
 * @param {object} gdsStats
 * @param {object} masteries
 */
export function calculateMasteries(gdsStats, masteries){

  /**
   * Corps
   */
  masteries.cor.value =
    Math.floor(
      (
        2 * gdsStats.con.value +
        2 * gdsStats.agi.value +
        gdsStats.sav.value
      ) / 5
      +
      masteries.cor.b_m
    );


  /**
   * Esprit
   */
  masteries.esp.value =
    Math.floor(
      (
        2 * gdsStats.mag.value +
        2 * gdsStats.men.value +
        gdsStats.sav.value
      ) / 5
      +
      masteries.esp.b_m
    );


  /**
   * Social
   */
  masteries.soc.value =
    Math.floor(
      (
        gdsStats.sav.value +
        4 * gdsStats.cha.value
      ) / 5
      +
      masteries.soc.b_m
    );

}