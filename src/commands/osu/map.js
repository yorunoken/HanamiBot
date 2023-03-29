const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const { v2, auth } = require("osu-api-extended");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");

const { mods } = require("../../../../mia-dev/src/utils/mods.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();

	let setPage = args.join(" ");
	if (!setPage.includes("-p") && !setPage.includes("-i") && !setPage.includes("-page") && !setPage.includes("-set")) setPage = undefined;
	else setPage = args[1];

	if (!setPage) setPage = undefined;
	if (setPage <= 0) setPage = undefined;

	let EmbedValue = 0;
	let GoodToGo = false;
	let beatmapID;

	await auth.login(process.env.client_id, process.env.client_secret);

	let argValues = {};
	for (const arg of args) {
		const [key, value] = arg.split("=");
		argValues[key] = value;
	}

	//if mods is undefined, set it to NM
	if (typeof argValues["mods"] === "undefined" || argValues["mods"] === "") {
		argValues["mods"] = "NM";
	}

	if (args.join("").includes("+")) {
		modsArg = args[args.indexOf("+") + 1]
			.slice(1)
			.toUpperCase()
			.match(/[A-Z]{2}/g);
		argValues["mods"] = modsArg.join("");
	}

	async function SendEmbed(beatmap, beatmapId, set, PageArg) {
		let redownload = false;
		if (beatmap.status != "loved" && beatmap.status != "ranked") redownload = true;
		const downloader = new Downloader({
			rootPath: "./osuBeatmapCache",

			filesPerSecond: 0,
			synchronous: true,
			redownload: redownload,
		});

		downloader.addSingleEntry(beatmapId);
		const DownloaderResponse = await downloader.downloadSingle();

		/**
			  check if the download gave a 429 error because I don't wanna get ip banned :^)
		*/
		if (DownloaderResponse.status == -3) {
			throw new Error("ERROR CODE 409, ABORTING TASK");
		}

		const { bpm = beatmap.bpm, ar = beatmap.ar, cs = beatmap.cs, hp = beatmap.drain, od = beatmap.accuracy } = argValues;
		const Argmods = argValues["mods"];
		const modsID = Argmods?.toUpperCase() === "NM" ? mods.id("NM") : mods.id(Argmods.toUpperCase());

		const iIndex = args.indexOf("-a");
		if (iIndex !== -1) {
			argValues.acc = args[iIndex + 1];
		}

		const iIndex2 = args.indexOf("-acc");
		if (iIndex2 !== -1) {
			argValues.acc = args[iIndex2 + 1];
		}

		const iIndex3 = args.indexOf("-bpm");
		if (iIndex3 !== -1) {
			bpm = args[iIndex3 + 1];
		}

		let clockRate =
			argValues["clock_rate"] !== undefined
				? argValues["clock_rate"]
				: argValues["clockrate"] !== undefined
				? argValues["clockrate"]
				: argValues["cr"] !== undefined
				? argValues["cr"]
				: argValues["mods"].toUpperCase().includes("DT") || argValues["mods"].toUpperCase().includes("NC")
				? 1.5
				: argValues["mods"].toUpperCase().includes("HT")
				? 0.75
				: bpm / beatmap.bpm;

		clockRate = Number(clockRate);

		if (Number.isNaN(ar)) ar = Number(beatmap.ar);
		if (Number.isNaN(cs)) cs = Number(beatmap.cs);
		if (Number.isNaN(hp)) hp = Number(beatmap.drain);
		if (Number.isNaN(od)) od = Number(beatmap.accuracy);
		const RuleSetID = beatmap.mode_int;

		let mapParam = {
			path: `./osuBeatmapCache/${beatmapId}.osu`,
			ar: ar,
			cs: cs,
			hp: hp,
			od: od,
		};

		let scoreParam = {
			mode: RuleSetID,
			mods: modsID,
		};

		let map = new Beatmap(mapParam);
		let calc = new Calculator(scoreParam);

		const mapValues = calc.clockRate(clockRate).mapAttributes(map);

		const performanceAcc100 = calc.clockRate(clockRate).acc(100).performance(map);
		const performanceAcc99 = calc.clockRate(clockRate).acc(99).performance(map);
		const performanceAcc97 = calc.clockRate(clockRate).acc(97).performance(map);
		const peformanceAcc95 = calc.clockRate(clockRate).acc(95).performance(map);

		let customAccPP = "";
		if (argValues.acc) {
			const customPP = calc.acc(Number(argValues.acc)).performance(map);
			customAccPP = `\n(${Number(argValues.acc)}%:  ${customPP.pp.toFixed(1)})`;
		}
		if (Number(argValues.acc) < 16.67) {
			const customPP = calc.acc(16.67).performance(map);
			customAccPP = `\n16.67%: ${customPP.pp.toFixed(1)}`;
		}

		if (!performanceAcc100.difficulty.nCircles) performanceAcc100.difficulty.nCircles = 0;
		if (!performanceAcc100.difficulty.nSliders) performanceAcc100.difficulty.nSliders = 0;
		if (!performanceAcc100.difficulty.nSpinners) performanceAcc100.difficulty.nSpinners = 0;
		if (!performanceAcc100.difficulty.nFruits) performanceAcc100.difficulty.nFruits = 0;

		let osuEmote;
		switch (beatmap.mode) {
			case "osu":
				osuEmote = "<:osu:1075928459014066286>";
				break;
			case "mania":
				osuEmote = "<:mania:1075928451602718771>";
				break;
			case "taiko":
				osuEmote = "<:taiko:1075928454651969606>";
				break;
			case "fruits":
				osuEmote = "<:ctb:1075928456367444018>";
				break;
			default:
				osuEmote = "No gamemode found.";
		}

		const starsRaw = performanceAcc100.difficulty.stars;
		const starsFixed = starsRaw.toFixed(2);
		const modsUpperCase = Argmods.toUpperCase();

		const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
		const beatmapObjects = performanceAcc100.difficulty.nCircles + performanceAcc100.difficulty.nSliders + performanceAcc100.difficulty.nSpinners + performanceAcc100.difficulty.nFruits;

		let arValue = mapValues.ar.toFixed(1);
		let odValue = mapValues.od.toFixed(1);
		let csValue = mapValues.cs.toFixed(2);
		let hpValue = mapValues.hp.toFixed(1);
		let bpmValue = mapValues.bpm.toFixed();

		switch (RuleSetID) {
			case 1:
				arValue = "-";
				csValue = "-";
				break;
			case 3:
				arValue = "-";
				csValue = "-";
				break;
		}

		const beatmapMaxCombo = performanceAcc100.difficulty.maxCombo.toLocaleString();
		const beatmapFavoriteCount = beatmap.beatmapset.favourite_count.toLocaleString();
		const beatmapPlayCount = beatmap.beatmapset.play_count.toLocaleString();

		const acc95PP = peformanceAcc95.pp.toFixed(1);
		const acc97PP = performanceAcc97.pp.toFixed(1);
		const acc99PP = performanceAcc99.pp.toFixed(1);
		const acc100PP = performanceAcc100.pp.toFixed(1);

		//length
		const lengthInSeconds = (beatmap.total_length / mapValues.clockRate).toFixed(0);
		const minutes = Math.floor(lengthInSeconds / 60);
		const seconds = (lengthInSeconds % 60).toString().padStart(2, "0");
		const mapLength = `\`${minutes}:${seconds}\``;

		var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
		const updatedDate = new Date(beatmap.last_updated).toLocaleDateString("en-US", options);

		let Updated_at;
		switch (beatmap.status) {
			case "ranked":
				Updated_at = `Ranked at ${updatedDate}`;
			case "loved":
				Updated_at = `Loved at ${updatedDate}`;
			case "qualified":
				Updated_at = `Qualified at ${updatedDate}`;
			default:
				Updated_at = `Last updated at ${updatedDate}`;
		}

		const field1 = {
			name: `${osuEmote} **[${beatmap.version}]**`,
			value: `Stars: [**[${starsFixed}★]**](${messageLink} \"${starsRaw}\") Mods: \`${modsUpperCase}\` BPM: \`${bpmValue}\`\nLength: ${mapLength} Max Combo: \`${beatmapMaxCombo}x\` Objects: \`${beatmapObjects}\`\nAR: \`${arValue}\` OD: \`${odValue}\` CS: \`${csValue}\` HP: \`${hpValue}\`\n\n:heart:**${beatmapFavoriteCount}** :play_pause:**${beatmapPlayCount}**`,
		};
		const field2 = {
			name: "PP",
			value: `\`\`\`Acc | PP\n95%:  ${acc95PP}\n97%:  ${acc97PP}\n99%:  ${acc99PP}\n100%: ${acc100PP}${customAccPP}\`\`\``,
			inline: true,
		};
		const field3 = {
			name: "Links",
			value: `:notes:[Song Preview](https://b.ppy.sh/preview/${beatmap.beatmapset_id}.mp3)\n🎬[Map Preview](https://osu.pages.dev/preview#${beatmap.id})\n🖼️[Full Background](https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/raw.jpg)\n<:beatconnect:1075915329512931469>[Beatconnect](https://beatconnect.io/b/${beatmap.beatmapset_id})\n<:kitsu:1075915745973776405>[Kitsu](https://kitsu.moe/d/${beatmap.beatmapset_id})`,
			inline: true,
		};

		//embed
		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `Beatmap by ${beatmap.beatmapset.creator}`,
				url: `https://osu.ppy.sh/users/${beatmap.user_id}`,
				iconURL: `https://a.ppy.sh/${beatmap.user_id}?1668890819.jpeg`,
			})
			.setTitle(`${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title}`)
			.setFields(field1, field2, field3)
			.setURL(`https://osu.ppy.sh/b/${beatmap.id}`)
			.setImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/cover.jpg`)
			.setFooter({ text: `Map ${PageArg} of ${set.length} | ${Updated_at}` });

		message.channel.send({ embeds: [embed] });
		return;
	}

	async function getTitleURL(embed) {
		const embed_TitleURL = embed.url;
		await getID(embed_TitleURL);
	}

	async function getAuthorURL(embed) {
		const embed_AuthorURL = embed.author.url;
		await getID(embed_AuthorURL);
	}

	async function getDescriptionURL(embed) {
		const regex = /\/(?:b|beatmaps)\/(\d+)/;
		const match = regex.exec(embed.description);
		const beatmapID = match[1];
		await getID(beatmapID);
	}

	page = setPage--;
	async function getID(urlRaw, beatmapID) {
		if (urlRaw) {
			// check if the url has a user link
			if (urlRaw.includes("/users/") || urlRaw.includes("/u/")) throw new Error("Wrong embed");
			beatmapID = urlRaw.match(/\d+/)[0];
		}

		let beatmap = await v2.beatmap.diff(beatmapID);
		if (beatmap.id == undefined) throw new Error("No URL");

		// define beatmapSet
		let beatmapSet = await v2.beatmap.set(beatmap.beatmapset_id);
		const sortedSet = beatmapSet.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating);

		if (setPage > sortedSet.length) {
			message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Please input a value not grater than ${sortedSet.length}`)] });
			GoodToGo = true;
			return;
		}

		// check if the user has provided a set page
		if (!isNaN(page)) beatmap = await v2.beatmap.diff(sortedSet[page].id);
		else setPage = sortedSet.findIndex((x) => x.difficulty_rating == beatmap.difficulty_rating) + 1;

		// send the map embed
		await SendEmbed(beatmap, beatmap.id, sortedSet, setPage);
		GoodToGo = true;
		return;
	}

	async function EmbedFetch(embed) {
		getTitleURL(embed)
			.catch((e) => getAuthorURL(embed))
			.catch((e) => getDescriptionURL(embed));
	}

	if (message.mentions.users.size > 0 && message.mentions.repliedUser.bot) {
		message.channel.messages.fetch(message.reference.messageId).then((message) => {
			const embed = message.embeds[0];
			EmbedFetch(embed);
		});
		return;
	}

	const channel = client.channels.cache.get(message.channel.id);
	channel.messages.fetch({ limit: 100 }).then(async (messages) => {
		//find the latest message with an embed
		let embedMessages = [];
		for (const [id, message] of messages) {
			if (message.embeds.length > 0 && message.author.bot) {
				embedMessages.push(message);
			}
		}

		try {
			if (args) {
				if (args.join(" ").startsWith("-p") || args.join(" ").startsWith("-i") || args.join(" ").startsWith("-page") || args.join(" ").startsWith("-set")) throw new Error("no page.");
				if (!args[0].startsWith("https:")) {
					// if args doesn't start with https: try to get the beatmap id by number provided
					beatmapID = args[0];
				} else {
					// try to get beatmapID by link
					const regex = /\/(\d+)$/;
					const match = regex.exec(args[0]);
					beatmapID = match[1];
				}

				await getID(beatmapID);
			} else throw new Error("no");
		} catch (err) {
			try {
				if (embedMessages) {
					do {
						if (!embedMessages[EmbedValue].embeds[0]) break;
						const embed = embedMessages[EmbedValue].embeds[0];
						await EmbedFetch(embed);
					} while (!GoodToGo);
				} else {
					await message.channel.send("No embeds found in the last 100 messages");
				}
			} catch (err) {
				message.channel.send("**No maps found, are you sure it's not a beatmapset?**");
			}
		}
	});
};
exports.name = "map";
exports.aliases = ["map", "m"];
exports.description = [
	"Displays the stats of a beatmap.\n\n**Parameters:**\n`link` get map by beatmap link\n`BPM=(number)` changes the BPM of the beatmap and gives its info (50-4000) also scales up other values with it\n`AR=(number)` changes the AR of the map\n`OD=(number)` changes the OD of the map\n`CS=(number)` changes the circle size of the map\n`mods=(string)` gets the beatmap info based on the mod combination",
];
exports.usage = ["map {link} {args}"];
exports.category = ["osu"];
