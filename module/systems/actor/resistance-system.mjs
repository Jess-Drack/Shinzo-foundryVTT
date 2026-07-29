/**
 * Gestion des résistances physiques et magiques
 *
 * Les résistances sont calculées à partir des grandes statistiques :
 * - Constitution → résistance physique
 * - Magie → résistance magique
 *
 * @param {object} systemData Données system de l'acteur
 * @param {object} gdsStats Grandes statistiques
 */
export function calculateResistance(systemData, gdsStats) {

  calculatePhysicalResistance(
    systemData.rdp,
    gdsStats.con
  );


  calculateMagicResistance(
    systemData.rdm,
    gdsStats.mag
  );

}


/**
 * Résistance physique
 *
 * Constitution :
 * >= 70 : bonus +1
 * <= 30 : malus -1
 * sinon : 0
 *
 * @param {object} resistance
 * @param {object} constitution
 */
function calculatePhysicalResistance(resistance, constitution) {

  const value = getResistanceModifier(
    constitution.value
  );


  resistance.deg_physique.value =
    Math.floor(
      value + resistance.deg_physique.b_m
    );


  resistance.res_physique.value =
    Math.floor(
      value + resistance.res_physique.b_m
    );

}



/**
 * Résistance magique
 *
 * Magie :
 * >= 70 : bonus +1
 * <= 30 : malus -1
 * sinon : 0
 *
 * @param {object} resistance
 * @param {object} magic
 */
function calculateMagicResistance(resistance, magic) {

  const value = getResistanceModifier(
    magic.value
  );


  resistance.deg_magique.value =
    Math.floor(
      value + resistance.deg_magique.b_m
    );


  resistance.res_magique.value =
    Math.floor(
      value + resistance.res_magique.b_m
    );

}



/**
 * Retourne le modificateur de résistance
 *
 * @param {number} stat
 * @returns {number}
 */
function getResistanceModifier(stat) {

  if (stat >= 70) {
    return 1;
  }


  if (stat <= 30) {
    return -1;
  }


  return 0;
}