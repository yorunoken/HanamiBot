const { Client, Collection, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
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
const { load } = require("./src/utils/loadCommands.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const token = process.env.TOKEN;
const rest = new REST({ version: "10" }).setToken(token);

client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.aliases = new Collection();

auth.login(process.env.client_id, process.env.client_secret, ["public"]).then((res) => console.log("Refreshed osu! token"));

client.on("ready", async () => {
  try {
    const slashCommands = await load(client);
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    console.log(`Logged in as ${client.user.tag}`);
  } catch (error) {
    console.error(error);
  }
});

client.addListener("debug", console.log);

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

client.login(token).catch((e) => console.log);
