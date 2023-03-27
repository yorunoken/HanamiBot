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
	128: "RX",
	256: "HT",
	576: "NC",
	1024: "FL",
	2048: "AT",
	4096: "SO",
	8192: "AP",
	16416: "PF",
	32768: "K4",
	65536: "K5",
	131072: "K6",
	262144: "K7",
	524288: "K8",
	1048576: "FI",
	2097152: "RD",
	4194304: "CM",
	8388608: "TP",
	16777216: "K9",
	33554432: "KC",
	67108864: "K1",
	134217728: "K3",
	268435456: "K2",
	1073741824: "MR",
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

function name(id) {
	if (isNaN(id)) return undefined;
	if (id == 0) return "NM";
	let binary = id.toString(2); // convert number to binary string
	let output = "";
	for (let i = binary.length - 1; i >= 0; i--) {
		if (binary[i] === "1") {
			let code = num_codes[Math.pow(2, binary.length - 1 - i)];
			output += code;
		}
	}

	return output;
}

module.exports = {
	mods: {
		name,
		id,
	},
};
