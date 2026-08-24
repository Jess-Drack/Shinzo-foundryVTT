/**
 * Calcul de la valeur globale du personnage
 *
 * @param {object} ssStats
 * @returns {number}
 */
export function calculateValuation(ssStats) {

  if (!ssStats) return 0;


  const skills = collectSkills(
    ssStats
  );


  const total = skills.reduce(
    (sum, skill) =>
      sum + (skill.value ?? 0),
    0
  );


  return Math.round(
    total / 10
  );

}



/**
 * Récupère toutes les compétences
 *
 * @param {object} ssStats
 * @returns {Array}
 */
function collectSkills(ssStats) {

  const skills = [];


  for (const group of Object.values(ssStats)) {

    if (
      typeof group !== "object"
    ) continue;


    for (const skill of Object.values(group)) {

      if (
        skill &&
        typeof skill === "object" &&
        "value" in skill
      ) {
        skills.push(skill);
      }

    }

  }


  return skills;

}