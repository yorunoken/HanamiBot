const { getTop } = require("../../utils/client_cmd/topIfFunc.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	let mode = "taiko";
	let RuleSetID = 1;

	getTop(message, args, prefix, mode, RuleSetID);
};
exports.name = ["topiftaiko"];
exports.aliases = ["topiftaiko", "topift", "tiftaiko", "tift", "tit"];
exports.description = [
	"Displays user's top plays if they had the desired mods\n\n**How to use:**\n`-{mods}` removes mod(s) from your top plays\n`+{mods}` add mod(s) to your top plays\n`!{mods}` forces a mod in your top plays, so if you do !DT, all of your top plays will have DT and DT only\n**Parameters:**\n`username` get the top plays of a user (must be first parameter)\n`-p (number)` get a specific page (1-20)",
];
exports.usage = [`topift "Random Japanese Name" !DT`];
exports.category = ["osu"];
