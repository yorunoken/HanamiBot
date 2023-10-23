import { Client, Collection, GatewayIntentBits } from "discord.js";
import { auth } from "osu-api-extended";
import fs from "fs";
const { CLIENT_SECRET, CLIENT_ID, TOKEN } = Bun.env;
if (!(CLIENT_SECRET && CLIENT_ID && TOKEN)) {
  throw new Error("WARNING: parameters have not been set in .env.local");
}

export class MyClient extends Client {
  slashCommands: Collection<any, any>;
  prefixCommands: Collection<any, any>;
  aliases: Collection<any, any>;

  constructor(options: any) {
    super(options);
    this.slashCommands = new Collection();
    this.prefixCommands = new Collection();
    this.aliases = new Collection();
  }
}

auth.login(parseInt(CLIENT_ID!), CLIENT_SECRET!, ["public"]);

const client = new MyClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
});

fs.readdirSync("./src/Handlers").forEach(async (file: any) => {
  const event = await require(`./Handlers/${file}`);
  client.on(event.name, (...args: any) => event.execute(...args, client));
});

process.on("unhandledRejection", (e) => {
  console.error(e);
});
process.on("uncaughtException", (e) => {
  console.error(e);
});
process.on("uncaughtExceptionMonitor", (e) => {
  console.error(e);
});

client.login(TOKEN);
