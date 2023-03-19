const fs = require("fs")
const { v2, auth, tools, mods } = require("osu-api-extended")
const { EmbedBuilder } = require("discord.js")

const { CardImage, CalculateSkill } = require("../../utils/card/cardCalculator.js")
const { FindUserargs } = require("../../utils/finduserargs_export.js")

module.exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	fs.readFile("./user-data.json", async (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		const userData = JSON.parse(data)
		let server = "bancho"

		let mode = "osu"
		let RuleSetId = 0

		var userargs = await FindUserargs(message, args, server, prefix)

		if (userargs.length === 0) {
			try {
				userargs = userData[message.author.id].BanchoUserId
			} catch (err) {
				message.reply(`Set your osu! username by typing "${prefix}link **your username**"`)
			}
		}

		//log in
		await auth.login(process.env.client_id, process.env.client_secret)
		const user = await v2.user.details(userargs, mode)
		if (user.id === undefined) {
			message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`**The player \`${userargs}\` does not exist**`)] })
			return
		}

		const WaitMesasge = await message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setTitle("Calculating...").setDescription("Please sit still while I'm calculating your plays, this may take a while if it's your first time using this command.")] })

		//formatted values for user
		try {
			global_rank = user.statistics.global_rank.toLocaleString()
			country_rank = user.statistics.country_rank.toLocaleString()
		} catch (err) {
			global_rank = 0
			country_rank = 0
		}
		let user_pp = user.statistics.pp.toLocaleString()

		let plays = await v2.user.scores.category(user.id, "best", {
			include_fails: "0",
			mode: mode,
			limit: "100",
			offset: "0",
		})

		const values = await CalculateSkill(plays, RuleSetId)

		let aimSkill = values.aim
		let speedSkill = values.speed
		let accSkill = values.acc

		if (aimSkill > 200) aimSkill = 200
		if (speedSkill > 200) speedSkill = 200
		if (accSkill > 200) accSkill = 200

		await CardImage(user, aimSkill, speedSkill, accSkill)
		const imagePath = `image.png`

		console.log(fs.existsSync(imagePath))

		const embed = new EmbedBuilder()
			.setColor("Purple")
			.setAuthor({
				name: `${user.username} ${user_pp}pp (#${global_rank} ${user.country_code}#${country_rank}) `,
				iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
				url: `https://osu.ppy.sh/users/${user.id}`,
			})
			.setImage(`attachment://image.png`)

		WaitMesasge.delete()
		message.channel.send({ embeds: [embed], files: [imagePath] })
	})
}
exports.name = ["card"]
exports.aliases = ["card", "cards"]
exports.description = ["Displays user's card\n\n**Parameters:**\n`username`"]
exports.usage = [`card YoruNoKen`]
exports.category = ["osu"]
