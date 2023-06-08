function calculator(plays, added_pp, user) {
  added_pp = Number(added_pp);
  if (added_pp <= plays[plays.length - 1].pp) {
    return false;
  }

  const plays_pp = plays
    .map((play) => play.pp)
    .concat(added_pp)
    .sort((a, b) => b - a);

  const weighted_plays_new = plays_pp.map((play, i) => play * 0.95 ** i - 1).slice(0, -1);
  const non_weighted_plays_new = plays_pp.slice(0, -1);

  const weighted_plays_old = plays.map((play, i) => play.pp * 0.95 ** i - 1).slice(0, -1);

  let total_sum_old = weighted_plays_old.reduce((a, b) => a + b);
  let total_sum_new = weighted_plays_new.reduce((a, b) => a + b);
  const bonus_pp = user.statistics.pp - total_sum_old;

  let pp_placement = 0;
  for (let i = 0; i < non_weighted_plays_new.length; i++) {
    if (non_weighted_plays_new[i] < added_pp) {
      break;
    }
    pp_placement++;
  }

  total_sum_new = total_sum_new + bonus_pp;
  total_sum_old = total_sum_old + bonus_pp;

  return {
    new_sum: total_sum_new,
    old_sum: total_sum_old,
    pp_placement,
    bonus_pp,
    difference: total_sum_new - total_sum_old,
  };
}
module.exports = { calculator };
