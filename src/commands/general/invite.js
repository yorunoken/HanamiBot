const { EmbedBuilder: E_Builder_invite } = require("discord.js")
exports.run = async (client, message, args, prefix, EmbedBuilder) => {
	await message.channel.sendTyping()

	const embed = new EmbedBuilder().setColor("Purple").setTitle(`Invite me to your server!`).setDescription(`You may invite me to your server using [this link](https://discord.com/api/oauth2/authorize?client_id=995999045157916763&permissions=1099646134598&scope=bot)`)
	message.channel.send({ embeds: [embed] })
}
exports.name = "invite"
exports.aliases = ["invite", "inv"]
exports.description = ["Get an invite link of the bot"]
exports.usage = [`invite`]
exports.category = ["general"]
