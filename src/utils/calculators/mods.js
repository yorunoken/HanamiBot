const mods = {
	NM: 0,
	NF: 1,
	EZ: 2,
	TD: 4,
	HD: 8,
	HR: 16,
	SD: 32,
	DT: 64,
	HT: 256,
	NC: 576,
	FL: 1024,
	SO: 4096,
	PF: 16416,
	FI: 1048576,
	RD: 2097152,
	MR: 1073741824,
};

const num_codes = {
	1: "NF",
	2: "EZ",
	4: "TD",
	8: "HD",
	16: "HR",
	32: "SD",
	64: "DT",
	256: "HT",
	576: "NC",
	1024: "FL",
	4096: "SO",
	16416: "PF",
	1048576: "FI",
	2097152: "RD",
	4194304: "LM",
	1073741824: "MR",
};

function id(combination) {
	if (combination.length == 0 || combination.toLowerCase() == "nm") return 0;
	const segmentedMods = combination.match(/.{1,2}/g);

	let BitArray = [];
	for (let i = 0; segmentedMods.length > i; i++) {
		BitArray.push(mods[segmentedMods[i]]);
	}

	if (BitArray.length == 0) return undefined;
	return BitArray.reduce((a, b) => a + b);
}

function name(id) {
	if (isNaN(id)) return undefined;
	const modCodes = Object.values(num_codes);
	const modId = modCodes.filter((_, i) => (id >> i) & 1).join("");
	if (!modId) return undefined;
	return modId;
}

module.exports = {
	mods: {
		name,
		id,
	},
};
