const { getTop } = require("./topFunc.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	let RB = false;
	let mode = "osu";
	let RuleSetID = 0;

	getTop(message, args, prefix, RB, mode, RuleSetID);
};
exports.name = ["osutop"];
exports.aliases = ["top", "osutop", "t"];
exports.description = ["Displays user's top plays\n\n**Parameters:**\n`username` get the top plays of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-p (number)` get a specific page (1-20)\n`-g (number)` find out how much of a pp play you have in your top plays"];
exports.usage = [`osutop whitecat -i 7\nosutop chocomint -p 4`];
exports.category = ["osu"];
