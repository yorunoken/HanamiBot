/**
 * this bot belongs
 * to the discord user
 * yoru#9267
 * hope you enjoy!
 */

//requirements
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require("discord.js");
const { auth } = require("./utils/auth.js");
const fs = require("fs");
require("dotenv/config");

let commandCount = 0;

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences],
});

// check if nessecary folders exist

console.log("checking for files..");
if (!fs.existsSync("mes")) {
	console.log("mes folder not found, creating folder..");
	fs.mkdirSync("mes");
} else console.log("mes ✔");

if (!fs.existsSync("beatmapsongs")) {
	console.log("beatmapsongs folder not found, creating folder..");
	fs.mkdirSync("beatmapsongs");
} else console.log("beatmapsongs ✔");

if (!fs.existsSync("osuBeatmapCache")) {
	console.log("osuBeatmapCache folder not found, creating folder..");
	fs.mkdirSync("osuBeatmapCache");
} else console.log("osuBeatmapCache ✔");

if (!fs.existsSync("user-data.json")) {
	console.log("user-data.json not found, creating file..");
	fs.writeFile("user-data.json", "{}", err => {
		console.log("user-data.json has been created!");
	});
} else console.log("user-data.json ✔");

if (!fs.existsSync("user-recent.json")) {
	console.log("user-recent.json not found, creating file..");
	fs.writeFile("user-recent.json", "{}", err => {
		console.log("user-recent.json has been created!");
	});
} else console.log("user-recent.json ✔");

if (!fs.existsSync("user-replay.json")) {
	console.log("user-replay.json not found, creating file..");
	fs.writeFile("user-replay.json", "{}", err => {
		console.log("user-replay.json has been created!");
	});
} else console.log("user-replay.json ✔");

// command handler
client.commands = new Map();
const commands = {};
const commandFolders = fs.readdirSync("src/commands");
for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith(".js") || file.endsWith(".ts"));

	for (const file of commandFiles) {
		const commandFile = require(`./commands/${folder}/${file}`);
		commands[commandFile.name] = {
			file: file,
			description: commandFile.description,
			category: commandFile.category,
			aliases: commandFile.aliases,
			usage: commandFile.usage,
		};
		module.exports = commands;

		client.commands.set(commandFile.name, commandFile);

		if (commandFile.aliases) {
			commandFile.aliases.forEach(alias => {
				client.commands.set(alias, commandFile);
			});
		}
	}
}

// user cooldown checker
const cooldowns = new Map();

client.on("ready", async () => {
	console.log(`Logged in as ${client.user.tag}, in ${client.guilds.cache.size} servers!`);
	console.log("Updating osu! bearer key..");
	console.log(await auth.login(process.env.client_id, process.env.client_secret));

	client.user.setPresence({
		activities: [{ name: `?help`, type: ActivityType.Playing }],
		status: "online",
	});

	commandCount = parseInt(fs.readFileSync("commandCount.txt"), 10);
});

client.on("guildCreate", guild => {
	const guilds = guild.channels.cache.find(g => g.type === 0);
	guilds.send(`Hello, I'm Mia and thank you for inviting me! I am an osu! bot created by yoru#9267. my default prefix is \`?\`. To start using the bot, you can set your osu! username by doing \`?link "your username"\`. to get a full list of all of the commands I have, please do \`?help\`, and to search for what specific commands do, do \`?help commandname\`. hope you enjoy! `);
});

client.on("messageCreate", message => {
	//load the prefixes for each guild
	let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
	let prefix = prefixes[message.guild.id] ?? "?";
	let DefaultPrefix = `<@995999045157916763> `;

	//respond with bot's prefix if bot is tagged
	if (message.content === `<@${client.user.id}>`) return message.reply(`my prefix is **${prefix}**`);

	if (message.content.startsWith(DefaultPrefix)) prefix = DefaultPrefix;

	//detect whether or not a command was executed
	if (message.content.startsWith(prefix)) {
		const args = message.content.slice(prefix.length).trim().split(/ +/g);
		const commandName = args.shift().toLowerCase();
		const command = client.commands.get(commandName);
		if (!command) return;

		// check if the user is still in cooldown period
		const cooldownAmount = (command.cooldown || 2) * 1000;
		const userID = message.author.id;
		const key = `${userID}-${commandName}`;
		if (cooldowns.has(key)) {
			const expirationTime = cooldowns.get(key) + cooldownAmount;
			if (Date.now() < expirationTime) {
				const timeLeft = (expirationTime - Date.now()) / 1000;
				message.reply(`**You're on cooldown, please wait ${timeLeft.toFixed(1)} more seconds and try again.**`);
				return;
			}
		}

		console.log(message.content);

		// execute the command
		command.run(client, message, args, prefix, EmbedBuilder);

		if (isNaN(commandCount)) commandCount = 0;
		commandCount++;
		console.log(commandCount);
		fs.writeFileSync("commandCount.txt", commandCount.toString());

		// setting the cooldown
		cooldowns.set(key, Date.now());
		setTimeout(() => cooldowns.delete(key), cooldownAmount);
	}
});

client.login(process.env.TOKEN);
