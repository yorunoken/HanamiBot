const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
async function FindUserargs(message, args, server, prefix) {
	let userargs;
	return new Promise((resolve, reject) => {
		fs.readFile("./user-data.json", async (error, data) => {
			if (error) {
				console.log(error);
				return message.reply("An error occurred while reading user data.");
			}
			const userData = JSON.parse(data);
			if (message.mentions.users.size > 0) {
				try {
					let mentionedUser;
					var UserArray = Array.from(message.mentions.users);
					mentionedUser = UserArray[0][1];

					console.log("first");
					try {
						if (message.reference.messageId && args.join(" ").includes(`<@`)) {
							console.log("second");
							mentionedUser = UserArray[UserArray.length - 1][1];
							if (server == "bancho") userargs = userData[mentionedUser.id].BanchoUserId;
							if (server == "gatari") userargs = userData[mentionedUser.id].GatariUserId;
						}
					} catch (err) {}

					if (args.join(" ").includes(`<@${mentionedUser.id}>`)) {
						try {
							console.log("third");
							if (server == "bancho") userargs = userData[mentionedUser.id].BanchoUserId;
							if (server == "gatari") userargs = userData[mentionedUser.id].GatariUserId;
						} catch (err) {
							message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`No osu! user found for ${mentionedUser.tag}`)] });
						}
					} else {
						let string = args.join(" ").match(/"(.*?)"/);
						if (string) {
							userargs = string[1];
						} else {
							userargs = args[0];
						}
					}
					if (args[0] === undefined) {
						try {
							if (server == "bancho") userargs = userData[message.author.id].BanchoUserId;
							if (server == "gatari") userargs = userData[message.author.id].GatariUserId;
						} catch (err) {
							console.error(err);
							message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Set your osu! username by typing "${prefix}link **your username**"`)] });
							return;
						}
					}
				} catch (err) {}
			} else {
				if (args[0] === undefined) {
					try {
						if (server == "bancho") userargs = userData[message.author.id].BanchoUserId;
						if (server == "gatari") userargs = userData[message.author.id].GatariUserId;
						if (server == "akatsuki") userargs = userData[message.author.id].AkatsukiUserId;
					} catch (err) {
						console.error(err);
						message.reply({ embeds: [new EmbedBuilder().setColor("Purple").setDescription(`Set your osu! username by typing "${prefix}link **your username**"`)] });
						return;
					}
				} else {
					let string = args.join(" ").match(/"(.*?)"/);
					if (string) {
						userargs = string[1];
					} else {
						userargs = args[0];
					}
				}
			}
			resolve(userargs);
		});
	});
}

module.exports = { FindUserargs };
