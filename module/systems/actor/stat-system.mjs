/**
 * Calcul des grandes statistiques
 *
 * Brut = valeur + bonus/malus
 *
 * @param {object} gdsStats
 */
export function calculatePrimaryStats(gdsStats) {

  if (!gdsStats) return;


  for (const stat of Object.values(gdsStats)) {

    calculatePrimaryStat(stat);

  }

}



/**
 * Calcul d'une statistique primaire
 *
 * @param {object} stat
 */
function calculatePrimaryStat(stat) {

  if (!stat) return;


  stat.brut = Math.floor(
    stat.value + stat.b_m
  );

}



/**
 * Calcul du total des grandes statistiques
 *
 * Exemple :
 * CON + AGI + MEN + MAG + CHA + SAV
 *
 * @param {object} gdsStats
 * @returns {number}
 */
export function calculateTotalPrimaryStats(gdsStats) {

  if (!gdsStats) return 0;


  return Object.values(gdsStats)
    .reduce(
      (total, stat) => total + stat.value,
      0
    );

}