function calculator(plays, added_pp, user) {
  added_pp = Number(added_pp);
  if (added_pp <= plays[plays.length - 1].pp) {
    return false;
  }
  let plays_pp = [];
  for (const play of plays) {
    plays_pp.push(play.pp);
  }
  plays_pp.push(added_pp);
  plays_pp = plays_pp.sort((a, b) => b - a);

  let weighted_plays_new = [];
  for (let i = 0; i < plays_pp.length; i++) {
    const play = plays_pp[i];
    let weighted_pp = play * 0.95 ** i - 1;
    weighted_plays_new.push(weighted_pp);
  }
  weighted_plays_new.pop();

  let non_weighted_plays_new = [];
  for (let i = 0; i < plays_pp.length; i++) {
    const play = plays_pp[i];
    let weighted_pp = play;
    non_weighted_plays_new.push(weighted_pp);
  }
  non_weighted_plays_new.pop();

  let weighted_plays_old = [];
  for (let i = 0; i < plays.length; i++) {
    const play = plays[i].pp;
    let weighted_pp = play * 0.95 ** i - 1;
    weighted_plays_old.push(weighted_pp);
  }
  weighted_plays_old.pop();

  let total_sum_old = weighted_plays_old.reduce((a, b) => a + b);
  let total_sum_new = weighted_plays_new.reduce((a, b) => a + b);
  const bonus_pp = user.statistics.pp - total_sum_old;

  let pp_placement = 0;
  for (let i = 0; i < non_weighted_plays_new.length; i++) {
    const pp = non_weighted_plays_new[i];
    if (pp < added_pp) {
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
