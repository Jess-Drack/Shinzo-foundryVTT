export class RollSystem {

  /**
   * Retourne la valeur maximale d'une statistique.
   */
  static getStatMaximum(stat) {

    const subStats = [
      "con",
      "agi",
      "men",
      "mag",
      "cha",
      "sav"
    ];

    return subStats.includes(stat)
      ? 80
      : 85;
  }

  /**
   * Prépare une statistique avant le jet.
   *
   * - limite basse : 15
   * - limite haute : 80 ou 85
   * - surplus => bonus critique (/2)
   */
  static prepareStat(value, stat, crit = 0) {

    let finalValue = Number(value) || 0;
    let finalCrit = Number(crit) || 0;

    const max = this.getStatMaximum(stat);

    if (finalValue < 15) {

      finalCrit -= (15 - finalValue);
      finalValue = 15;

    }

    if (finalValue > max) {

      finalCrit += Math.floor(
        (finalValue - max) / 2
      );

      finalValue = max;

    }

    return {
      stat,
      brut: Number(value),
      value: finalValue,
      crit: finalCrit,
      max
    };

  }


   /**
   * Préparation utilisée par les fiches
   *
   * Permet à l'ActorSheet
   * d'utiliser exactement
   * les mêmes règles que les jets.
   */
  static getPreparedStat(
    actor,
    statName
  ) {


    let stat =
      actor.system.gds_stats?.[statName]
      ??
      actor.system.ss_stats?.ss_stats1?.[statName]
      ??
      actor.system.ss_stats?.ss_stats2?.[statName];



    if (!stat)
      return null;



    return this.prepareStat(

      stat.value,

      statName,

      stat.addCrit ?? 0

    );


  }


  /**
   * Lance un jet de statistique.
   */
  static async rollStat({
    actor,
    stat,
    label,
    value,
    modifier = 0,
    formula = "1d100",
    crit = 0,
    prepared = null
  }) {

    const finalStat = modifier !== 0 ? this.prepareStat(
      prepared.brut + modifier,
      stat,
      prepared.crit
    )
    :prepared;

    const successCrit =
      5 + Math.max(finalStat.crit, 0);

    const failureCrit =
      96 - Math.max(-finalStat.crit, 0);

    const roll =
      await new Roll(formula).evaluate();

    let flavor;

    if (roll.total <= successCrit) {

      flavor =
        `[<span class="reussite rc">${label}</span>] C'est une réussite critique !!!!`;

    }

    else if (roll.total >= failureCrit) {

      flavor =
        `[<span class="echec ec">${label}</span>] C'est un échec critique !!!!`;

    }

    else if (roll.total < finalStat.value) {

      if (
        [
          "con",
          "mag",
          "pug",
          "cac",
          "pre",
          "esq"
        ].includes(stat)
      ) {

        const diff =
          finalStat.value - roll.total;

        flavor =
          `[<span class="reussite">${label}</span>] C'est une réussite. La différence est de ${diff}.`;

      }

      else {

        flavor =
          `[<span class="reussite">${label}</span>] C'est une réussite.`;

      }

    }

    else {

      flavor =
        `[<span class="echec">${label}</span>] C'est un échec.`;

    }

    roll.toMessage({

      speaker:
        ChatMessage.getSpeaker({
          actor
        }),

      flavor

    });

    return roll;

  }

  /**
   * Calcule le malus automatique /2
   *
   * Exemple :
   * Stat 80
   * Malus = -40
   */
  static getHalfPenalty(statValue) {


    return Math.floor(
      -Number(statValue) / 2
    );


  }

}