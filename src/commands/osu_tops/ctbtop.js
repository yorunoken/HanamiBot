const { getTop } = require("./topFunc.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	let RB = false;
	let mode = "fruits";
	let RuleSetID = 2;

	getTop(message, args, prefix, RB, mode, RuleSetID);
};
exports.name = ["ctbtop"];
exports.aliases = ["ctbtop", "ctop", "topc", "topctb"];
exports.description = ["Displays user's Catch the Beat top plays\n\n**Parameters:**\n`username` get the top plays of a user (must be first parameter) \n`-i (number)` get a specific play (1-100)\n`-p (number)` get a specific page (1-20)\n`-g (number)` find out how much of a pp play you have in your top plays"];
exports.usage = [`ctbtop YesMyDarkness -i 16\nctbtop YesMyDarkness -p 8`];
exports.category = ["osu"];
