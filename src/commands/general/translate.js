const { translate } = require("@vitalets/google-translate-api");
const { EmbedBuilder } = require("discord.js");

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping();

	let TranslateTo = "en";
	const Text = args.join(" ");

	let res;
	try {
		res = await translate(Text, { to: TranslateTo });
	} catch (err) {
		console.log(err);
		message.channel.send(`There appears to be an error with the api. Please try again.`);
		return;
	}

	try {
		const embed = new EmbedBuilder()
			.setTitle(`Translated from ${res.raw.src.toUpperCase()} to ${TranslateTo.toUpperCase()}`)
			.setColor("Purple")
			// .setThumbnail(`${message.author.displayAvatarURL()}?size=1024`)
			.setDescription(`raw:\n> ${Text}\n\ntranslated:\n> ${res.text}`)
			.setFooter({ text: `Requested by ${message.author.username}` });

		message.channel.send({ embeds: [embed] });
	} catch (err) {
		message.channel.send(`${err}`);
	}
};
exports.name = "translate";
exports.aliases = ["translate", "tr"];
exports.description = ["Translates your text to English!"];
exports.usage = [`translate naber dostum ne yapıyorsun`];
exports.category = ["general"];
