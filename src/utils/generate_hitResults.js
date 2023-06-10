const { Beatmap, Calculator } = require("rosu-pp");

function generate_hitResults_osu(data, objectCount) {
  let n300;

  let nmiss = data.n_misses ?? 0;
  let n50 = data.n50 ?? 0;
  let n100 = data.n100 ?? 0;
  let acc = data.acc ? data.acc / 100 : undefined;
  const totalResultCount = objectCount;

  if (acc) {
    const targetTotal = Math.round(acc * totalResultCount * 6);
    const delta = targetTotal - (totalResultCount - nmiss);

    n300 = Math.floor(delta / 5);
    n100 = Math.min(delta % 5, totalResultCount - n300 - nmiss);
    n50 = totalResultCount - n300 - n100 - nmiss;

    const n = Math.min(n300, Math.floor(n50 / 4));
    n300 -= n;
    n100 += 5 * n;
    n50 -= 4 * n;
  } else {
    n300 = totalResultCount - n100 - n50 - nmiss;
  }

  return {
    n300: n300,
    n100: n100,
    n50: n50,
    n_misses: nmiss,
  };
}

function generate_hitResults_taiko(data, objectCount) {
  let acc = data.acc ? data.acc / 100 : undefined;
  let n300 = data.n300 ?? undefined;
  let n100 = data.n100 ?? undefined;
  let nmiss = data.n_misses ?? 0;

  const remaining = objectCount - (n300 ?? 0) - (n100 ?? 0) - nmiss;

  if (acc) {
    if (n300 && n100) {
      n300 = n300 + remaining;
    } else if (n300 && !n100) {
      n100 = remaining;
    } else if (!n300 && n100) {
      n300 = objectCount - (n100 + nmiss);
    } else {
      const targetTotal = Math.round(acc * objectCount * 2);
      n300 = targetTotal - (objectCount - nmiss);
      n100 = objectCount - (n300 + nmiss);
    }
  } else {
    if (n300 && !n100) {
      n100 = remaining;
    } else if (n300 && n100) {
      n300 = n300 + remaining;
    } else if (!n300 && n100) {
      n300 = remaining;
    }
  }

  return {
    n300: n300,
    n100: n100,
    n_misses: nmiss,
  };
}

function generate_hitResults_mania(data, objectCount) {
  let n_objects = objectCount;

  let n320 = data.n_geki ? parseInt(data.n_geki) : 0;
  let n300 = data.n300 ? parseInt(data.n300) : 0;
  let n200 = data.n_katu ? parseInt(data.n_katu) : 0;
  let n100 = data.n100 ? parseInt(data.n100) : 0;
  let n50 = data.n50 ? parseInt(data.n50) : 0;
  let n_misses = data.n_miss ? parseInt(data.n_miss) : 0;

  if (data.acc !== undefined) {
    let acc = parseInt(data.acc) / 100.0;
    let target_total = Math.round(acc * (n_objects * 6));

    if (data.n_geki !== undefined && data.n300 !== undefined && data.n_katu !== undefined && data.n100 !== undefined && data.n50 !== undefined) {
      let remaining = n_objects - (n320 + n300 + n200 + n100 + n50 + n_misses);
      n320 += remaining;
    } else if (data.n_geki !== undefined && !data.n300 && data.n_katu !== undefined && data.n100 !== undefined && data.n50 !== undefined) {
      n300 = n_objects - (n320 + n200 + n100 + n50 + n_misses);
    } else if (!data.n_geki && data.n300 !== undefined && data.n_katu !== undefined && data.n100 !== undefined && data.n50 !== undefined) {
      n320 = n_objects - (n300 + n200 + n100 + n50 + n_misses);
    } else if (data.n_geki !== undefined && (data.n_katu !== undefined || data.n100 !== undefined) && data.n50 !== undefined) {
      n50 = n_objects - (n320 + n300 + n200 + n100 + n_misses);
    } else if ((data.n_geki !== undefined || data.n300 !== undefined) && (data.n_katu !== undefined || data.n100 === undefined || data.n50 === undefined)) {
      let n3x0 = n320 + n300;
      let delta = target_total - (n_objects - n_misses) - n3x0 * 5 - n200 * 3;

      n100 = delta % 5;
      n50 = n_objects - (n3x0 + n200 + n100 + n_misses);

      let curr_total = 6 * n3x0 + 4 * n200 + 2 * n100 + n50;

      if (curr_total < target_total) {
        let n = Math.min(target_total - curr_total, n50);
        n50 -= n;
        n100 += n;
      } else {
        let n = Math.min(curr_total - target_total, n100);
        n100 -= n;
        n50 += n;
      }
    } else if ((data.n_geki !== undefined || data.n300 !== undefined) && (data.n_katu !== undefined || data.n100 !== undefined || data.n50 === undefined)) {
      let n3x0 = n320 + n300;
      let delta = target_total - (n_objects - n_misses) - n3x0 * 5 - n100;

      n200 = Math.floor(delta / 3);
      n50 = n_objects - (n3x0 + n200 + n100 + n_misses);
    } else if ((data.n_geki !== undefined || data.n300 !== undefined) && (data.n_katu === undefined || data.n100 !== undefined || data.n50 !== undefined)) {
      n100 = n_objects - (n320 + n300 + n50 + n_misses);
    } else if (!data.n_geki && !data.n300 && data.n_katu !== undefined && data.n100 !== undefined && data.n50 !== undefined) {
      n320 = n_objects - (n200 + n100 + n50 + n_misses);
    } else if (!data.n_geki && !data.n300 && !data.n_katu && data.n100 !== undefined && data.n50 !== undefined) {
      let delta = target_total - (n_objects - n_misses) - n100;

      n320 = Math.floor(delta / 5);
      n200 = n_objects - (n320 + n100 + n50 + n_misses);

      let curr_total = 6 * (n320 + n300) + 4 * n200 + 2 * n100 + n50;

      if (curr_total < target_total) {
        let n = Math.min(target_total - curr_total, n200);
        n200 -= n;
        n320 += n;
      } else {
        let n = Math.min(n320 + n300, curr_total - target_total);
        n200 += n;
        n320 -= n;
      }
    } else if (!data.n_geki && !data.n300 && data.n_katu === undefined && data.n100 === undefined && data.n50 === undefined) {
      let delta = target_total - (n_objects - n_misses);

      n320 = Math.floor(delta / 5);
      n100 = delta % 5;
      n50 = n_objects - (n320 + n300 + n100 + n_misses);

      let n = Math.min(n320, Math.floor(n50 / 4));
      n320 -= n;
      n100 += 5 * n;
      n50 -= 4 * n;
    }
  } else {
    let remaining = n_objects - (n320 + n300 + n200 + n100 + n50 + n_misses);

    if (data.n_geki === undefined) {
      n320 = remaining;
    } else if (data.n300 === undefined) {
      n300 = remaining;
    } else if (data.n_katu === undefined) {
      n200 = remaining;
    } else if (data.n100 === undefined) {
      n100 = remaining;
    } else if (data.n50 === undefined) {
      n50 = remaining;
    } else {
      n320 += remaining;
    }
  }

  return {
    n_geki: n320,
    n300: n300,
    n_katu: n200,
    n100: n100,
    n50: n50,
    n_miss: n_misses,
  };
}

function generate_hitResults_fruits(data, objectCount) {
  let max_combo = objectCount;

  let n_fruits = max_combo;
  let n_droplets = 0;
  let n_tiny_droplets = 0;
  let n_tiny_droplet_misses = 0;
  let n_misses = 0;

  return {
    n300: n_fruits,
    n100: n_droplets,
    n50: n_tiny_droplets,
    n_katu: n_tiny_droplet_misses,
    n_miss: n_misses,
  };
}

/**
 * Generates hit results based on the provided map, data, and mode.
 *
 * @param {number} objectCount - Total amount of objects.
 * @param {object} data - The data object.
 * @param {"taiko", "osu", "mania", "fruits"} mode - The gamemode (eg. "osu", "mania", "fruits", "taiko")
 * @returns {{ n300: number, n100: number, n50: number, n_katu: number, n_geki: number, n_misses: number }} The generated hit results.
 */

function generateHitResults({ data, objectCount, mode }) {
  switch (mode.toLowerCase()) {
    case "osu":
      return generate_hitResults_osu(data, objectCount);
    case "taiko":
      return generate_hitResults_taiko(data, objectCount);
    case "mania":
      return generate_hitResults_mania(data, objectCount);
    case "fruits":
      return generate_hitResults_fruits(data, objectCount);
  }
}

module.exports = {
  generateHitResults,
};
