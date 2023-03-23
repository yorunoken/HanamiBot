const { createCanvas, loadImage } = require("canvas");
const { formatTitle } = require("./format-text");
const Path = `./src/utils/card/`;

const fs = require("fs");
const { Beatmap, Calculator } = require("rosu-pp");
const { Downloader, DownloadEntry } = require("osu-downloader");

const { mods } = require("../../utils/mods.js");

async function CardImage(user, aimProg, speedProg, accProg) {
	const width = 658;
	const height = 846;

	const titleY = 80;
	const lineHeight = 100;
	const titleX = 329;

	const UserY = 130;
	const UserX = 329;

	const post = {
		title: "USER CARD",
		user: user.username,
		aim: "AIM",
		speed: "SPEED",
		acc: "ACCURACY",
		rank: "Global Rank",
		cRank: "Country Rank",
	};

	const values = {
		aim: aimProg,
		speed: speedProg,
		acc: accProg,
		rank: `#${user.statistics.global_rank}`,
		cRank: `#${user.statistics.country_rank}`,
	};

	const AvatarPosition = {
		w: 230,
		h: 230,
		x: 214,
		y: 160,
	};

	const BackgroundPosition = {
		w: width,
		h: height,
		x: 0,
		y: 0,
	};

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	const pp = user.statistics.pp / 1000;

	let BgNumber;
	if (pp > 2.5) BgNumber = 1;
	if (pp > 5) BgNumber = 2;
	if (pp > 7.5) BgNumber = 3;
	if (pp > 10) BgNumber = 4;
	if (pp > 12.5) BgNumber = 5;
	if (pp > 15) BgNumber = 6;

	ctx.rotate(0);
	const Background = await loadImage(`${Path}bgs/star${BgNumber}.jpg`);
	var { w, h, x, y } = BackgroundPosition;
	ctx.drawImage(Background, x, y, w, h);

	const Star = await loadImage(`${Path}star.png`);
	if (BgNumber > 0) ctx.drawImage(Star, 15, 55, 48, 49);
	if (BgNumber > 1) ctx.drawImage(Star, 70, 45, 54, 55);
	if (BgNumber > 2) ctx.drawImage(Star, 125, 30, 62, 64);
	if (BgNumber > 3) ctx.drawImage(Star, width - 181, 30, 62, 64);
	if (BgNumber > 4) ctx.drawImage(Star, width - 117, 45, 54, 55);
	if (BgNumber > 5) ctx.drawImage(Star, width - 54, 55, 48, 49);

	const UserAvatar = await loadImage(user.avatar_url);
	var { w, h, x, y } = AvatarPosition;
	ctx.drawImage(UserAvatar, x, y, w, h);

	ctx.font = "bold 40pt 'Coolvetica'";
	ctx.textAlign = "center";
	ctx.fillStyle = "#fff";

	const textTitle = formatTitle(post.title);
	ctx.fillText(textTitle[0], titleX, titleY);
	if (textTitle[1]) ctx.fillText(textTitle[1], titleX, titleY + lineHeight);

	ctx.font = "bold 30pt 'Coolvetica'";
	ctx.textAlign = "center";
	ctx.fillStyle = "#fff";

	const textUser = formatTitle(post.user);
	ctx.fillText(textUser[0], UserX, UserY);
	if (textUser[1]) ctx.fillText(textUser[1], UserX, UserY + lineHeight);

	ctx.font = "bold 25pt 'Coolvetica'";
	ctx.textAlign = "center";
	ctx.fillStyle = "#fff";

	/**
	 * Rank values
	 */
	const gRank = formatTitle(post.rank);
	ctx.fillText(gRank[0], 100, 255);
	const gRankValue = formatTitle(values.rank);
	ctx.fillText(gRankValue[0], 100, 300);

	const cRank = formatTitle(post.cRank);
	ctx.fillText(cRank[0], 555, 255);
	const cRankValue = formatTitle(values.cRank);
	ctx.fillText(cRankValue[0], 555, 300);

	/**
	 * Performance values
	 */
	ctx.font = "bold 30pt 'Coolvetica'";
	ctx.textAlign = "center";
	ctx.fillStyle = "#fff";

	const aim = formatTitle(post.aim);
	ctx.fillText(aim[0], 329, 475);

	const accuracy = formatTitle(post.acc);
	ctx.fillText(accuracy[0], 329, 600);

	const speed = formatTitle(post.speed);
	ctx.fillText(speed[0], 329, 725);

	function BarFilled(barValue) {
		const maxValue = 200;
		const barWidth = 350;
		return (Math.min(barValue, maxValue) / maxValue) * barWidth;
	}

	const aimSkillBar = BarFilled(aimProg);
	const speedSkillBar = BarFilled(speedProg);
	const accSkillBar = BarFilled(accProg);

	/**
	 * Performance bar
	 */
	// aim bar
	ctx.fillStyle = "#595959";
	ctx.fillRect(154, 495, 350, 35);
	ctx.fillStyle = "#ffff";
	ctx.fillRect(154, 495, aimSkillBar, 35);
	const aimValue = formatTitle(values.aim);
	ctx.fillText(aimValue[0], 550, 527);

	// acc bar
	ctx.fillStyle = "#595959";
	ctx.fillRect(154, 745, 350, 35);
	ctx.fillStyle = "#ffff";
	ctx.fillRect(154, 745, speedSkillBar, 35);
	const speedValue = formatTitle(values.speed);
	ctx.fillText(speedValue[0], 550, 777);

	// speed bar
	ctx.fillStyle = "#595959";
	ctx.fillRect(154, 620, 350, 35);
	ctx.fillStyle = "#ffff";
	ctx.fillRect(154, 620, accSkillBar, 35);
	const accValue = formatTitle(values.acc);
	ctx.fillText(accValue[0], 550, 652);

	const buffer = canvas.toBuffer("image/png");
	fs.writeFileSync("image.png", buffer);
}

async function CalculateSkill(scores, ruleset) {
	let acc = 0.0;
	let aim = 0.0;
	let speed = 0.0;
	let weight_sum = 0.0;

	const ACC_NERF = 1.3;
	const AIM_NERF = 2.6;
	const SPEED_NERF = 2.4;

	let stars = [];
	let avgpp = [];
	let miss = [];

	for (let i = 0; i < scores.length; i++) {
		const score = scores[i];

		let redownload = false;
		if (score.beatmap.status != "loved" && score.beatmap.status != "ranked") redownload = true;
		console.log(`no file, ${i}`);
		const downloader = new Downloader({
			rootPath: "./osuBeatmapCache",

			filesPerSecond: 2,
			synchronous: true,
			redownload: redownload,
		});

		downloader.addSingleEntry(score.beatmap.id);
		const DownloaderResponse = await downloader.downloadSingle();
		if (DownloaderResponse.status == -3) {
			throw new Error("ERROR CODE 409, ABORTING TASK");
		}

		let modsID = mods.id(score.mods.join(""));
		if (!score.mods.join("").length) modsID = 0;

		let scoreParam = {
			mode: ruleset,
			mods: modsID,
		};

		let map = new Beatmap({ path: `./osuBeatmapCache/${score.beatmap.id}.osu` });

		const pp = new Calculator(scoreParam).n100(score.statistics.count_100).n300(score.statistics.count_300).n50(score.statistics.count_50).nMisses(Number(score.statistics.count_miss)).combo(score.max_combo).nGeki(score.statistics.count_geki).nKatu(score.statistics.count_katu).performance(map);

		stars.push(pp.difficulty.stars);
		avgpp.push(pp.pp);
		miss.push(score.statistics.count_miss);

		const acc_val = pp.ppAcc / ACC_NERF;
		const aim_val = pp.ppAim / AIM_NERF;
		const speed_val = pp.ppSpeed / SPEED_NERF;
		const weight = 0.95 ** i;

		acc += acc_val * weight;
		aim += aim_val * weight;
		speed += speed_val * weight;
		weight_sum += weight;
	}

	const map = value => Math.round(value * 100) / 100;

	acc = map(acc / weight_sum);
	aim = map(aim / weight_sum);
	speed = map(speed / weight_sum);

	return { acc, aim, speed };
}

module.exports = { CardImage, CalculateSkill };
