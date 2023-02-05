/**
 * this bot belongs
 * to the discord user
 * yoru#9267
 * hope you enjoy!
 */

//requirements
const {
  Client,
  GatewayIntentBits,
  ActivityType,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
require("dotenv/config");
const MongoToken = process.env.database_token
const { connect } = require('mongoose');


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
});

//command handler
client.commands = new Map();
const commands = {};
const commandFolders = fs.readdirSync("./commands")
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

  for (const file of commandFiles) {
    const commandFile = require(`./commands/${folder}/${file}`);
    commands[commandFile.name] = {
      file: file,
      description: commandFile.description,
      category: commandFile.category,
      aliases: commandFile.aliases,
      usage: commandFile.usage,
    }
    module.exports = commands;

    client.commands.set(commandFile.name, commandFile);

    if (commandFile.aliases) {
      commandFile.aliases.forEach(alias => {
        client.commands.set(alias, commandFile);
      });
    }
  }
}





client.on("ready", async () => {

  console.log(`Logged in as ${client.user.tag}, in ${client.guilds.cache.size} servers!`);
  console.log(`server list:`)

});

client.on('guildCreate', (guild) => {
  
  const guilds = guild.channels.cache.find(g => g.type === 0)
  guilds.send(`Hello, I'm Mia and thank you for inviting me! I am an osu! bot created by yoru#9267. my default prefix is \`?\`. To start using the bot, you can set your osu! username by doing \`?osuset "your username"\`. to get a full list of all of the commands I have, please do \`?help\`, and to search for what specific commands do, do \`?search commandname\`. hope you enjoy! `)

})


client.on("messageCreate", (message) => {


  //load the prefixes for each guild
  let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
  let prefix
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
    const commandName = args.shift().toLowerCase()
    const command = client.commands.get(commandName);
    if (!command)
      return
    command.run(client, message, args, prefix, EmbedBuilder);
  }
});
client.login(process.env.TOKEN);