const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
  shards: "auto",
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction, Partials.GuildScheduledEvent, Partials.User, Partials.ThreadMember],
});
require("dotenv/config");
const { MongoClient } = require("mongodb");
const { auth } = require("osu-api-extended");
const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const token = process.env.TOKEN;

client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.aliases = new Collection();

const rest = new REST({ version: "10" }).setToken(token);

// slash command handler
const prefixCommands = [];
const prefixFolders = fs.readdirSync("./src/commands/prefix");
for (const folder of prefixFolders) {
  const commandFiles = fs.readdirSync(`./src/commands/prefix/${folder}`);

  for (const file of commandFiles) {
    const command = require(`./src/commands/prefix/${folder}/${file}`);
    client.prefixCommands.set(command.name, command);
    prefixCommands.push(command.name, command);
    if (command.aliases && Array.isArray(command.aliases)) {
      command.aliases.forEach((alias) => {
        client.aliases.set(alias, command.name);
      });
    }
  }
}

// slash command handler
const slashCommands = [];
const slashFolders = fs.readdirSync("./src/commands/slash");
for (const folder of slashFolders) {
  const commandFiles = fs.readdirSync(`./src/commands/slash/${folder}`);

  for (const file of commandFiles) {
    const command = require(`./src/commands/slash/${folder}/${file}`);
    let jsonData;
    try {
      jsonData = JSON.parse(command.data);
    } catch (e) {}
    if (jsonData) {
      slashCommands.push(command.data.toJSON());
    } else {
      slashCommands.push(command.data);
    }
    client.slashCommands.set(command.data.name, command);
  }
}

const refreshAuth = async () => {
  try {
    await auth.login(process.env.client_id, process.env.client_secret, ["public"]);
    console.log("Refreshed osu! token");
  } catch (error) {
    console.error(error);
  }
};
refreshAuth();
setInterval(refreshAuth, 1000 * 60 * 60 * 8);

client.on("ready", async () => {
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    console.log(`Logged in as ${client.user.tag}`);
  } catch (error) {
    console.error(error);
  }
});

async function events() {
  const client = await MongoClient.connect(process.env.MONGO);
  console.log("Successfully connected to MongoDB!");
  const db = client.db("miaBot");
  return db;
}

events().then((database) => {
  module.exports = {
    // this is to to be able to include @param in other files
    database,
  };

  // event handler
  fs.readdirSync("./src/handlers").forEach(async (file) => {
    const event = await require(`./src/handlers/${file}`);
    client.on(event.name, (...args) => event.execute(...args, database));
  });
});

// nodejs events
process.on("unhandledRejection", (e) => {
  console.error(e);
});
process.on("uncaughtException", (e) => {
  console.error(e);
});
process.on("uncaughtExceptionMonitor", (e) => {
  console.error(e);
});

client.login(token);
