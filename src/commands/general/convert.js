const { EmbedBuilder } = require("discord.js");
const { convert } = require("../../utils/convert.js");
exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();
	let string = args.join(" ").match(/"(.*?)"/);

	let sentence = args[0];
	if (string) sentence = string[1];

	let converted_sentence;
	let sentence_language = undefined;

	switch (true) {
		case args.join(" ").toLowerCase().includes("-georgian"):
			sentence_language = "Georgian";
			converted_sentence = convert.georgian(sentence);
			break;
		case args.join(" ").toLowerCase().includes("-japanese"):
			sentence_language = "Japanese";
			converted_sentence = convert.japanese(sentence);
			break;
	}

	message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setTitle(`Latin alphabet to ${sentence_language}`).setDescription(`> ${converted_sentence}`)] });
};
exports.name = "convert";
exports.aliases = ["convert", "convertlanguage", "cl"];
exports.description = ['Converts a latin sentence to a language\n\n**Parameters**\n`"{Latin sentence}" The latin sentence to convert\n`-{language to convert}` language to convert the latin sentence to '];
exports.usage = [`georgian khali`];
exports.category = ["general"];
