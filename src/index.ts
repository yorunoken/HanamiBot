import { GatewayIntentBits } from "discord.js";
import fs from "fs";
import { auth } from "osu-api-extended";
import { MyClient } from "./classes";
const { CLIENT_SECRET, CLIENT_ID, TOKEN } = Bun.env;
if (!CLIENT_SECRET || !CLIENT_ID || !TOKEN) {
  throw new Error("WARNING: parameters have not been set in .env.local");
}

const client = new MyClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
});

auth.login(parseInt(CLIENT_ID), CLIENT_SECRET, ["public"]);
fs.readdirSync("./src/Handlers").forEach(async (file: any) => {
  const event = await import(`./Handlers/${file}`);
  client.on(event.name, (...args: any) => event.execute(...args, client));
});

// setInterval(() => (client.sillyOptions = {}), 2 * 60 * 1000);

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
