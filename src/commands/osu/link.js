const fs = require("fs")
const { v2, auth } = require("osu-api-extended")
const axios = require("axios")

exports.run = async (client, message, args, prefix) => {
	await message.channel.sendTyping()

	let server = "bancho"
	let defaultServer

	let string = args.join(" ").match(/"(.*?)"/)
	if (string) {
		username = string[1]
	} else {
		username = args[0]
	}

	let argValues = {}
	for (const arg of args) {
		const [key, value] = arg.split("=")
		argValues[key] = value
	}

	if (argValues["server"] == "bancho") server = "bancho"
	if (argValues["server"] == "gatari") server = "gatari"

	if (argValues["default"] == "bancho") defaultServer = "bancho"
	if (argValues["default"] == "gatari") defaultServer = "gatari"

	if (username == undefined) {
		message.reply("**Please provide a username.**")
		return
	}

	if (defaultServer) {
		fs.readFile("./user-data.json", (error, data) => {
			if (error) {
				console.log(error)
				return
			}

			const userData = JSON.parse(data)
			userData[message.author.id] = { ...userData[message.author.id], server: defaultServer }
			fs.writeFile("./user-data.json", JSON.stringify(userData, null, 2), error => {
				if (error) {
					console.log(error)
				} else {
					message.reply(`Set default server to **${defaultServer}**`)
				}
			})
		})
		return
	}

	if (server == "bancho") {
		//log into api
		await auth.login(process.env.client_id, process.env.client_secret)
		const user = await v2.user.details(username, "osu")
		if (user.id == undefined) {
			message.reply(`**The user \`${username}\` does not exist in the Bancho database.**`)
			return
		}
		var user_id = user.id
		// Read the JSON file
		fs.readFile("./user-data.json", (error, data) => {
			if (error) {
				console.log(error)
				return
			}
			//update the user's osu! username in the JSON file
			const userData = JSON.parse(data)
			userData[message.author.id] = { ...userData[message.author.id], BanchoUserId: user_id }
			fs.writeFile("./user-data.json", JSON.stringify(userData, null, 2), error => {
				if (error) {
					console.log(error)
				} else {
					message.reply(`Set osu! bancho username to **${user.username}**`)
				}
			})
		})
	} 

	if (server == "gatari") {
		var url = `https://api.gatari.pw/users/get?u=`

		const response = await axios.get(`${url}${username}`)
		const data = response.data

		const user = data.users[0]
		if (user == undefined) {
			message.reply(`**The user \`${username}\` does not exist in the Gatari database.**`)
			return
		}
		var user_id = user.id
		// Read the JSON file
		fs.readFile("./user-data.json", (error, data) => {
			if (error) {
				console.log(error)
				return
			}

			//update the user's osu! username in the JSON file
			const userData = JSON.parse(data)
			userData[message.author.id] = { ...userData[message.author.id], GatariUserId: user_id }
			fs.writeFile("./user-data.json", JSON.stringify(userData, null, 2), error => {
				if (error) {
					console.log(error)
				} else {
					message.reply(`Set osu! gatari username to **${user.username}**`)
				}
			})
		})
	}
}
exports.name = "link"
exports.aliases = ["link"]
exports.description = ["Sets a nickname as your default**Parameters:**\n`username` set your username to the argument\n To set your default gamemode, see `setmode`"]
exports.usage = [`link YoruNoKen`]
exports.category = ["osu"]
