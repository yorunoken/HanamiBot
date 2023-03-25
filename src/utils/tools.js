function accuracy({ n300, n100, n50, nmiss, ngeki, nkatu, mode }) {
	if (!mode) throw new Error("mode is not defined");
	if (n300 < 0) throw new Error("Invalid 300 count");
	if (n100 < 0) throw new Error("Invalid 100 count");
	if (n50 < 0) throw new Error("Invalid 500 count");
	if (nmiss < 0) throw new Error("Invalid miss count");
	if (nkatu < 0) throw new Error("Invalid katu count");
	if (ngeki < 0) throw new Error("Invalid geki count");

	n300 = Number(n300) || 0;
	n100 = Number(n100) || 0;
	n50 = Number(n50) || 0;
	nmiss = Number(nmiss) || 0;
	ngeki = Number(ngeki) || 0;
	nkatu = Number(nkatu) || 0;

	switch (mode.toLowerCase()) {
		case "taiko":
			return (100 * (n300 + 0.5 * n100)) / (n300 + n100 + nmiss);
		case "mania":
			return (100 * (300 * (ngeki + n300) + 200 * nkatu + 100 * n100 + 50 * n50)) / (300 * (ngeki + n300 + n100 + n50 + nmiss));
		case "fruits":
			return (100 * (n300 + n100 + n50)) / (n300 + n100 + n50 + nkatu + nmiss);
		default:
			return (100 * (300 * n300 + 100 * n100 + 50 * n50)) / (300 * (n300 + n100 + n50 + nmiss));
	}
}

function grade({ n300, n100, n50, nmiss, nkatu, ngeki, mode, mods }) {
	if (!mode) throw new Error("mode is not defined");
	if (n300 < 0) throw new Error("Invalid 300 count");
	if (n100 < 0) throw new Error("Invalid 100 count");
	if (n50 < 0) throw new Error("Invalid 500 count");
	if (nmiss < 0) throw new Error("Invalid miss count");
	if (nkatu < 0) throw new Error("Invalid katu count");
	if (ngeki < 0) throw new Error("Invalid geki count");
	if (Array.isArray(mods)) mods = mods.join("");

	const is_HD = mods.toUpperCase().includes("HD");
	const is_FL = mods.toUpperCase().includes("FL");

	n300 = Number(n300) || 0;
	n100 = Number(n100) || 0;
	n50 = Number(n50) || 0;
	nmiss = Number(nmiss) || 0;
	ngeki = Number(ngeki) || 0;
	nkatu = Number(nkatu) || 0;

	function calculatePercentage(hits, objects) {
		return (hits / objects) * 100;
	}

	if (mode.toLowerCase() == "osu") {
		const total_objects = n300 + n100 + n50 + nmiss;

		const percent_of_300 = calculatePercentage(n300, total_objects);
		const percent_of_50 = calculatePercentage(n50, total_objects);

		switch (true) {
			case percent_of_300 === 100 && !is_HD && !is_FL:
				return "X";
			case percent_of_300 > 90 && !is_HD && !is_FL:
				return nmiss >= 1 || percent_of_50 > 1 ? "A" : "S";
			case percent_of_300 === 100 && (is_HD || is_FL):
				return "XH";
			case percent_of_300 > 90 && (is_HD || is_FL):
				return nmiss > 0 || percent_of_50 > 1 ? "A" : "SH";
			case percent_of_300 > 80:
				return nmiss > 0 ? "B" : "A";
			case percent_of_300 > 70:
				return nmiss > 0 ? "C" : "B";
			case percent_of_300 > 60:
				return nmiss > 0 ? "D" : "C";
			default:
				return "D";
		}
	}

	if (mode.toLowerCase() == "taiko") {
		const total_hit = n300 + n100 + nmiss;
		const percent = calculatePercentage(n300, total_hit);

		switch (true) {
			case percent === 100 && !mods.toUpperCase().includes("HD") && !mods.toUpperCase().includes("FL"):
				return "X";
			case percent > 90 && !mods.toUpperCase().includes("HD") && !mods.toUpperCase().includes("FL"):
				return nmiss >= 1 ? "A" : "S";
			case percent === 100 && mods.toUpperCase().includes("HD") && mods.toUpperCase().includes("FL"):
				return "XH";
			case percent > 90 && mods.toUpperCase().includes("HD") && mods.toUpperCase().includes("FL"):
				return nmiss >= 1 ? "A" : "SH";
			case percent > 80:
				return nmiss >= 1 ? "B" : "A";
			case percent > 70:
				return nmiss >= 1 ? "C" : "B";
			case percent > 60:
				return nmiss >= 1 ? "D" : "C";
			default:
				return "D";
		}
	}

	if (mode.toLowerCase() == "mania") {
		const acc = accuracy({
			n300: n300,
			n100: n100,
			n50: n50,
			nmiss: nmiss,
			ngeki: ngeki,
			nkatu: nkatu,
			mode: mode,
		});

		switch (true) {
			case acc === 100 && !mods.toUpperCase().includes("HD") && !mods.toUpperCase().includes("FL"):
				return "X";
			case acc > 95 && !mods.toUpperCase().includes("HD") && !mods.toUpperCase().includes("FL"):
				return "S";
			case acc === 100 && mods.toUpperCase().includes("HD") && mods.toUpperCase().includes("FL"):
				return "XH";
			case acc > 95 && mods.toUpperCase().includes("HD") && mods.toUpperCase().includes("FL"):
				return "SH";
			case acc > 90:
				return "A";
			case acc > 80:
				return "B";
			case acc > 70:
				return "C";
			default:
				return "D";
		}
	}

	if (mode.toLowerCase() == "fruits") {
		const acc = accuracy({
			n300: n300,
			n100: n100,
			n50: n50,
			nmiss: nmiss,
			ngeki: ngeki,
			nkatu: nkatu,
			mode: mode,
		});

		switch (true) {
			case acc === 100 && !mods.toUpperCase().includes("HD") && !mods.toUpperCase().includes("FL"):
				return "X";
			case acc >= 98.01 && !mods.toUpperCase().includes("HD") && !mods.toUpperCase().includes("FL"):
				return "S";
			case acc === 100 && mods.toUpperCase().includes("HD") && mods.toUpperCase().includes("FL"):
				return "XH";
			case acc >= 98.01 && mods.toUpperCase().includes("HD") && mods.toUpperCase().includes("FL"):
				return "SH";
			case acc >= 94.01:
				return "A";
			case acc >= 90.01:
				return "B";
			case acc >= 85.01:
				return "C";
			default:
				return "D";
		}
	}
}

module.exports = {
	tools: {
		accuracy,
		grade,
	},
};
