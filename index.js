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





//log
client.on("ready", async () => {

  console.log(
    `Logged in as ${client.user.tag}, in ${client.guilds.cache.size} servers!`
  );
  console.log(`server list:`);
  // ${owner.username}
  client.guilds.cache.forEach((guild) => {
    guild.fetchOwner().then(owner => {
      console.log(`${guild.name} `);
    });
  });


});


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


