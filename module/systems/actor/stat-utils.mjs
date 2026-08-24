export function checkStat(stat, min = 15, max = 85) {
  if (stat.value < min) {
    stat.addCrit = -(min - stat.value);
    stat.value = min;
  } else if (stat.value > max) {
    stat.addCrit = Math.floor((stat.value - max) / 2);
    stat.value = max;
  } else {
    stat.addCrit = 0;
  }
}

export function checkGdStat(stat, min = 15, max = 85) {
  if (stat.brut < min) {
    stat.addCrit = -(min - stat.brut);
    stat.brut = min;
  } else if (stat.brut > max) {
    stat.addCrit = Math.floor((stat.brut - max) / 2);
    stat.brut = max;
  } else {
    stat.addCrit = 0;
  }
}