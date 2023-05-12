const mods = {
  NM: 0,
  NF: 1,
  EZ: 2,
  TD: 4,
  HD: 8,
  HR: 16,
  SD: 32,
  DT: 64,
  RX: 128,
  HT: 256,
  NC: 576, // Only set along with DoubleTime. i.e: NC only gives 576
  FL: 1024,
  AT: 2048,
  SO: 4096,
  AP: 8192, // Autopilot
  PF: 16416, // Only set along with SuddenDeath. i.e: PF only gives 16416
  K4: 32768,
  K5: 65536,
  K6: 131072,
  K7: 262144,
  K8: 524288,
  FI: 1048576,
  RD: 2097152,
  CM: 4194304,
  TP: 8388608,
  K9: 16777216,
  KC: 33554432,
  K1: 67108864,
  K3: 134217728,
  K2: 268435456,
  MR: 1073741824,
};

const modsEnum = {
  0: "NM",
  1: "NF",
  2: "EZ",
  4: "TD",
  8: "HD",
  16: "HR",
  32: "SD",
  64: "DT",
  256: "HT",
  576: "NC", // Only set along with DoubleTime. i.e: NC only gives 576
  1024: "FL",
  4096: "SO",
  16416: "PF", // Only set along with SuddenDeath. i.e: PF only gives 16416
  1048576: "FI",
  2097152: "RD",
  1073741824: "MR",
};
const modsOrder = {
  nf: 0,
  ez: 1,
  hd: 2,
  dt: 3,
  nc: 3,
  ht: 3,
  hr: 4,
  so: 5,
  sd: 5,
  pf: 5,
  fl: 6,
  td: 7,
};

function id(name) {
  if (!name || name.toLowerCase() === "nm") {
    return 0;
  }
  const segmentedMods = name.match(/.{1,2}/g) || [];
  const enumMods = segmentedMods.map((mod) => mods[mod]);
  return enumMods.reduce((a, b) => a + b);
}

function name(id) {
  let modsArray = [];
  let _mods = id;
  let convertedMods = "";
  const modValues = Object.keys(modsEnum).map((a) => Number(a));
  for (let i = modValues.length - 1; i >= 0; i--) {
    const currentValue = modValues[i];
    if (_mods >= currentValue) {
      const mode = modsEnum[currentValue];
      modsArray.push({ order: modsOrder[mode.toLowerCase()], mod: mode });
      _mods -= currentValue;
    }
  }
  modsArray = modsArray.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));
  modsArray.filter((r) => (convertedMods += r.mod));
  if (convertedMods.endsWith("NM")) {
    convertedMods = convertedMods.slice(0, -2);
  }
  if (convertedMods === "") {
    return "NM";
  }
  return convertedMods;
}

module.exports = {
  mods: {
    name,
    id,
  },
};
