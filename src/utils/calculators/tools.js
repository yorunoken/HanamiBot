function accuracy({ n300, n100, n50, nmiss, ngeki, nkatu }, mode) {
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

function grade({ n300, n100, n50, nmiss, nkatu, ngeki }, mode, mods) {
	if (!mode) return undefined;

	n300 = Number(n300) || 0;
	n100 = Number(n100) || 0;
	n50 = Number(n50) || 0;
	nmiss = Number(nmiss) || 0;
	ngeki = Number(ngeki) || 0;
	nkatu = Number(nkatu) || 0;

	const TotalHit = n300 + n100 + n50 + nmiss + ngeki + nkatu;
	function calculatePercentage(num, total) {
		return (num / total) * 100;
	}

	if (mode.toLowerCase() == "osu") {
		const percent = calculatePercentage(n300, TotalHit);
		const percent50 = calculatePercentage(n50, TotalHit);

		switch (true) {
			case percent === 100 && !mods.toUpperCase().includes("HD") && !mods.toUpperCase().includes("FL"):
				return "X";
			case percent > 90 && !mods.toUpperCase().includes("HD") && !mods.toUpperCase().includes("FL"):
				return nmiss >= 1 || percent50 > 1 ? "A" : "S";
			case percent === 100 && mods.toUpperCase().includes("HD") && mods.toUpperCase().includes("FL"):
				return "XH";
			case percent > 90 && mods.toUpperCase().includes("HD") && mods.toUpperCase().includes("FL"):
				return nmiss >= 1 || percent50 > 1 ? "A" : "SH";
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

	if (mode.toLowerCase() == "taiko") {
		const percent = calculatePercentage(n300, TotalHit);

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
		const acc = accuracy(
			{
				n300: n300,
				n100: n100,
				n50: n50,
				nmiss: nmiss,
				ngeki: ngeki,
				nkatu: nkatu,
			},
			mode,
		);

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
		const acc = accuracy(
			{
				n300: n300,
				n100: n100,
				n50: n50,
				nmiss: nmiss,
				ngeki: ngeki,
				nkatu: nkatu,
			},
			mode,
		);

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
