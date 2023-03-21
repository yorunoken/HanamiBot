/**
 * this bot belongs
 * to the discord user
 * yoru#9267
 * hope you enjoy!
 */

//requirements
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require("discord.js");
const { auth } = require("./utils/calculators/auth.js");
const fs = require("fs");
require("dotenv/config");

let commandCount = 0;

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences],
});

// check if nessecary folders exist

console.log("checking for folders..");
if (!fs.existsSync("mes")) {
	console.log("mes folder not found, creating folder..");
	fs.mkdirSync("mes");
} else console.log("mes ✔");

if (!fs.existsSync("cache")) {
	console.log("cache folder not found, creating folder..");
	fs.mkdirSync("cache");
} else console.log("cache ✔");

if (!fs.existsSync("bin")) {
	console.log("bin folder not found, creating folder..");
	fs.mkdirSync("bin");
} else console.log("bin ✔");

if (!fs.existsSync("beatmapsongs")) {
	console.log("beatmapsongs folder not found, creating folder..");
	fs.mkdirSync("beatmapsongs");
} else console.log("beatmapsongs ✔");

if (!fs.existsSync("osuBeatmapCache")) {
	console.log("osuBeatmapCache folder not found, creating folder..");
	fs.mkdirSync("osuBeatmapCache");
} else console.log("osuBeatmapCache ✔");

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
	auth.login(process.env.clien_id, process.env.client_secret);
	console.log("osu! bearer key updated.");

	client.user.setPresence({
		activities: [{ name: `?help`, type: ActivityType.Playing }],
		status: "online",
	});

	try {
		commandCount = parseInt(fs.readFileSync("commandCount.txt"), 10);
	} catch (error) {
		console.error(`Error reading command count from file: ${error}`);
	}
});

client.on("guildCreate", guild => {
	const guilds = guild.channels.cache.find(g => g.type === 0);
	guilds.send(`Hello, I'm Mia and thank you for inviting me! I am an osu! bot created by yoru#9267. my default prefix is \`?\`. To start using the bot, you can set your osu! username by doing \`?link "your username"\`. to get a full list of all of the commands I have, please do \`?help\`, and to search for what specific commands do, do \`?help commandname\`. hope you enjoy! `);
});

client.on("messageCreate", message => {
	//load the prefixes for each guild
	let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
	let prefix;
	//check if the guild has a prefix stored in the prefixes.json file
	if (!prefixes[message.guild.id]) {
		//if not, set the prefix to the default prefix
		prefix = "?";
	} else {
		//if the guild has a prefix stored, use that prefix
		prefix = prefixes[message.guild.id];
	}

	//respond with bot's prefix if bot is tagged
	if (message.content === `<@${client.user.id}>`) {
		message.reply(`my prefix is **${prefix}**`);
	}

	//detect whether or not a command was executed
	if (message.content.toLowerCase().startsWith(prefix)) {
		const args = message.content.slice(prefix.length).trim().split(/ +/g);
		const commandName = args.shift().toLowerCase();
		const command = client.commands.get(commandName);
		if (!command) return;

		// check if the user is still in cooldown period
		const cooldownAmount = (command.cooldown || 2) * 1000;
		const userId = message.author.id;
		const key = `${userId}-${commandName}`;
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
