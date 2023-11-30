import { GatewayIntentBits } from "discord.js";
import { auth } from "osu-api-extended";
import { ExtendedClient } from "./Structure/index";
const { CLIENT_SECRET, CLIENT_ID, TOKEN } = Bun.env;
if (!CLIENT_SECRET || !CLIENT_ID || !TOKEN) {
  throw new Error("WARNING: parameters have not been set in .env.local");
}

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
});

auth.login(parseInt(CLIENT_ID), CLIENT_SECRET, ["public"]);

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
