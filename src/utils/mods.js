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

const num_codes = {
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
const mods_order = {
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
	if (name.length == 0 || name.toLowerCase() == "nm") return 0;
	const segmentedMods = name.match(/.{1,2}/g);

	let BitArray = [];
	for (let i = 0; segmentedMods.length > i; i++) {
		BitArray.push(mods[segmentedMods[i]]);
	}

	if (BitArray.length == 0) return undefined;
	return BitArray.reduce((a, b) => a + b);
}

function name(mods) {
	let enabled = [];
	let _mods = mods;
	let converted = "";
	const modValues = Object.keys(num_codes).map((a) => Number(a));
	for (let i = modValues.length - 1; i >= 0; i--) {
		const currentValue = modValues[i];
		if (_mods >= currentValue) {
			const mode = num_codes[currentValue];
			enabled.push({ i: mods_order[mode.toLowerCase()], n: mode });
			_mods -= currentValue;
		}
	}
	enabled = enabled.sort((a, b) => (a.i > b.i ? 1 : b.i > a.i ? -1 : 0));
	enabled.filter((r) => (converted += r.n));
	if (converted.endsWith("NM")) {
		converted = converted.slice(0, -2);
	}
	if (converted === "") {
		return "NM";
	}
	return converted;
}

module.exports = {
	mods: {
		name,
		id,
	},
};
