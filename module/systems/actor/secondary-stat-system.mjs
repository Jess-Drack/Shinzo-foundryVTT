/**
 * Secondary Statistics System
 *
 * Gestion des sous statistiques Shinzo
 *
 * Les sous statistiques sont calculées à partir :
 * - des grandes statistiques
 * - des maîtrises
 * - des bonus/malus personnalisés
 */


/* -------------------------------------------- */
/* Calcul des sous statistiques                 */
/* -------------------------------------------- */


export function calculateSecondaryStats(
  gdsStats,
  masteries,
  ssStats
){

  if (
    !gdsStats ||
    !masteries ||
    !ssStats
  ) return;



  const s1 = ssStats.ss_stats1;
  const s2 = ssStats.ss_stats2;


  if (!s1 || !s2) return;



  /*
   * Groupe 1
   * Combat / perception
   */


  calculateStat(
    s1.pug,
    (2 * gdsStats.con.value + masteries.cor.value) / 3
  );


  calculateStat(
    s1.cac,
    (gdsStats.con.value + 2 * masteries.cor.value) / 3
  );


  calculateStat(
    s1.pre,
    (masteries.esp.value + 3 * masteries.cor.value) / 4
  );


  calculateStat(
    s1.esq,
    (masteries.cor.value + 2 * gdsStats.agi.value) / 3
  );


  calculateStat(
    s1.par,
    masteries.cor.value
  );


  calculateStat(
    s1.dis,
    (masteries.soc.value + 2 * gdsStats.agi.value) / 3
  );


  calculateStat(
    s1.obs,
    (masteries.soc.value + 3 * gdsStats.men.value) / 4
  );


  calculateStat(
    s1.per,
    (masteries.esp.value + 3 * gdsStats.mag.value) / 4
  );


  calculateStat(
    s1.psy,
    (
      gdsStats.mag.value +
      gdsStats.men.value +
      2 * masteries.esp.value
    ) / 4
  );


  calculateStat(
    s1.int,
    (gdsStats.con.value + 2 * masteries.soc.value) / 3
  );




  /*
   * Groupe 2
   * Social / technique
   */


  calculateStat(
    s2.com,
    masteries.soc.value
  );


  calculateStat(
    s2.aut,
    (masteries.soc.value + gdsStats.cha.value) / 2
  );


  calculateStat(
    s2.med,
    (gdsStats.sav.value + masteries.esp.value) / 2
  );


  calculateStat(
    s2.pil,
    (masteries.soc.value + masteries.esp.value) / 2
  );


  calculateStat(
    s2.art,
    (masteries.soc.value + masteries.esp.value) / 2
  );


  calculateStat(
    s2.vit,
    (gdsStats.agi.value + masteries.cor.value) / 2
  );


  calculateStat(
    s2.ins,
    (gdsStats.men.value + masteries.esp.value) / 2
  );


  calculateStat(
    s2.s_f,
    (gdsStats.sav.value + masteries.esp.value) / 2
  );


  calculateStat(
    s2.reg,
    (gdsStats.con.value + masteries.esp.value) / 2
  );


  calculateStat(
    s2.rec,
    (gdsStats.mag.value + masteries.esp.value) / 2
  );

}



/* -------------------------------------------- */
/* Calcul d'une sous statistique                */
/* -------------------------------------------- */


function calculateStat(
  stat,
  baseValue
){

  if (!stat) return;


  stat.value =
    Math.floor(
      baseValue +
      (stat.mod ?? 0) +
      (stat.b_m ?? 0)
    );

}





/* -------------------------------------------- */
/* Total des modificateurs                      */
/* -------------------------------------------- */


export function calculateTotalModifiers(ssStats){

  if (!ssStats)
    return 0;


  let total = 0;



  const groups = [
    ssStats.ss_stats1,
    ssStats.ss_stats2
  ];



  for (const group of groups){


    if (!group)
      continue;



    for (const stat of Object.values(group)){


      total += stat.mod ?? 0;


    }

  }



  return Math.floor(total);

}