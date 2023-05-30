function generate_hitresults_osu(objectCount, data) {
  const n_objects = objectCount;

  let n300 = data.n300 !== undefined ? data.n300 : 0;
  let n100 = data.n100 !== undefined ? data.n100 : 0;
  let n50 = data.n50 !== undefined ? data.n50 : 0;
  const n_misses = data.n_miss !== undefined ? data.n_miss : 0;

  if (data.acc !== undefined) {
    const acc = data.acc / 100.0;
    const target_total = Math.round(acc * n_objects * 6);

    switch (true) {
      case data.n300 !== undefined && data.n100 !== undefined && data.n50 !== undefined:
        n300 += Math.max(0, n_objects - (n300 + n100 + n50 + n_misses));
        break;
      case data.n300 !== undefined && data.n100 !== undefined && data.n50 === undefined:
        n50 = Math.max(0, n_objects - (n300 + n100 + n_misses));
        break;
      case data.n300 !== undefined && data.n100 === undefined && data.n50 !== undefined:
        n100 = Math.max(0, n_objects - (n300 + n50 + n_misses));
        break;
      case data.n300 === undefined && data.n100 !== undefined && data.n50 !== undefined:
        n300 = Math.max(0, n_objects - (n100 + n50 + n_misses));
        break;
      case data.n300 !== undefined && data.n100 === undefined && data.n50 === undefined:
        delta = Math.max(0, target_total - (n_objects - n_misses));
        n100 = delta % 5;
        n50 = Math.max(0, n_objects - (n300 + n100 + n_misses));
        curr_total = 6 * n300 + 2 * n100 + n50;
        if (curr_total < target_total) {
          const n = Math.min(target_total - curr_total, n50);
          n50 -= n;
          n100 += n;
        } else {
          const n = Math.min(curr_total - target_total, n100);
          n100 -= n;
          n50 += n;
        }
        break;
      case data.n300 === undefined && data.n100 !== undefined && data.n50 === undefined:
        delta = Math.max(0, target_total - (n_objects - n_misses));
        n300 = Math.floor(delta / 5);
        if (n300 + n100 + n_misses > n_objects) {
          n300 -= n300 + n100 + n_misses - n_objects;
        }
        n50 = n_objects - n300 - n100 - n_misses;
        break;
      case data.n300 === undefined && data.n100 === undefined && data.n50 !== undefined:
        delta = Math.max(0, target_total - (n_objects - n_misses));
        n300 = Math.floor(delta / 5);
        n100 = delta % 5;
        if (n300 + n100 + n50 + n_misses > n_objects) {
          const too_many = n300 + n100 + n50 + n_misses - n_objects;
          if (too_many > n100) {
            n300 -= too_many - n100;
            n100 = 0;
          } else {
            n100 -= too_many;
          }
        }
        n100 += Math.max(0, n_objects - (n300 + n100 + n50 + n_misses));
        const curr_total = 6 * n300 + 2 * n100 + n50;
        if (curr_total < target_total) {
          const n = Math.min(n100, Math.floor((target_total - curr_total) / 4));
          n100 -= n;
          n300 += n;
        } else {
          const n = Math.min(n300, Math.floor((curr_total - target_total) / 4));
          n300 -= n;
          n100 += n;
        }
        break;
      case data.n300 === undefined && data.n100 === undefined && data.n50 === undefined:
        const delta = Math.max(0, target_total - (n_objects - n_misses));
        n300 = Math.floor(delta / 5);
        n100 = delta % 5;
        n50 = Math.max(0, n_objects - (n300 + n100 + n_misses));
        const n = Math.min(n300, Math.floor(n50 / 4));
        n300 -= n;
        n100 += 5 * n;
        n50 -= 4 * n;
        break;
    }
  } else {
    const remaining = n_objects - (n300 + n100 + n50 + n_misses);
    if (data.n300 === undefined) {
      n300 = remaining;
    } else if (data.n100 === undefined) {
      n100 = remaining;
    } else if (data.n50 === undefined) {
      n50 = remaining;
    } else {
      n300 += remaining;
    }
  }

  const state = {
    n300: n300,
    n100: n100,
    n50: n50,
    n_misses: n_misses,
    max_combo: 0,
  };

  return state;
}

function generate_hitresults_taiko(data) {
  const total_result_count = data.max_combo !== undefined ? data.max_combo : 0;

  let n300 = data.n300 !== undefined ? data.n300 : 0;
  let n100 = data.n100 !== undefined ? data.n100 : 0;
  const n_misses = data.n_miss !== undefined ? data.n_miss : 0;

  if (data.acc !== undefined) {
    const acc = data.acc / 100.0;

    switch (true) {
      case data.n300 !== undefined && data.n100 !== undefined:
        n300 += Math.max(0, total_result_count - (n300 + n100 + n_misses));
        break;
      case data.n300 !== undefined && data.n100 === undefined:
        n100 += Math.max(0, total_result_count - (n300 + n_misses));
        break;
      case data.n300 === undefined && data.n100 !== undefined:
        n300 += Math.max(0, total_result_count - (n100 + n_misses));
        break;
      case data.n300 === undefined && data.n100 === undefined:
        const target_total = Math.round(acc * total_result_count * 2);
        n300 = target_total - (total_result_count - n_misses);
        n100 = total_result_count - (n300 + n_misses);
        break;
    }
  } else {
    const remaining = total_result_count - (n300 + n100 + n_misses);

    switch (true) {
      case data.n300 !== undefined && data.n100 === undefined:
        n100 = remaining;
        break;
      case data.n300 !== undefined && data.n100 !== undefined:
        n300 += remaining;
        break;
      case data.n300 === undefined && data.n100 !== undefined:
        n300 = remaining;
        break;
    }
  }

  const state = {
    n300: n300,
    n100: n100,
    n_misses: n_misses,
    max_combo: 0,
  };

  return state;
}

/**
 * Generates hit results based on the provided map, data, and mode.
 *
 * @param {number | string} objectCount - The map object.
 * @param {object} data - The data object.
 * @param {string} mode - The mode to generate hit results for (e.g., "osu", "taiko").
 * @returns {{ n300: number, n100: number, n50: number, n_misses: number, max_combo: number }} The generated hit results.
 */

function generate_hitresults(objectCount, data, mode) {
  switch (mode) {
    case "osu":
      return generate_hitresults_osu(objectCount, data);
    case "taiko":
      return generate_hitresults_taiko(data);
  }
}

module.exports = {
  generate_hitresults,
};
