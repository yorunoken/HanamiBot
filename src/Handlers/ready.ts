import { Database } from "bun:sqlite";
import fs from "fs";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { MyClient } from "../classes";
import { getServer, insertData } from "../utils";

const token = Bun.env.TOKEN as string;
const rest = new REST({ version: "10" }).setToken(token);

export const db = new Database(`./src/data.db`);
db.run(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data TEXT
);`);
db.run(`CREATE TABLE IF NOT EXISTS servers (
  id INTEGER PRIMARY KEY,
  data TEXT
);
`);
db.run(`CREATE TABLE IF NOT EXISTS maps (
  id INTEGER PRIMARY KEY,
  data TEXT
);
`);
console.log("Database up and running!");

async function loadSlashCommands(client: MyClient) {
  if (!client.user) return;

  const slashCommands: any = [];
  const commandsCategories = fs.readdirSync("./src/SlashCommands");
  for (const category of commandsCategories) {
    if (category === "data") continue;
    const commands = fs.readdirSync(`./src/SlashCommands/${category}`);

    for (const cmd of commands) {
      // const commandFilePath = `../SlashCommands/${category}/${cmd}`;
      // const commandFileName = path.parse(commandFilePath).name;
      const command = require(`../SlashCommands/${category}/${cmd}`);
      slashCommands.push(command.data.toJSON());

      client.slashCommands.set(command.data.name, command);
    }
  }

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
  } catch (error) {
    console.error(error);
  }
}

function loadPrefixCommands(client: MyClient) {
  if (!client.user) return;

  const prefixCommands = [];
  const commandsCategories = fs.readdirSync("./src/PrefixCommands");
  for (const category of commandsCategories) {
    if (category === "data") continue;
    const commands = fs.readdirSync(`./src/PrefixCommands/${category}`);

    for (const cmd of commands) {
      const command = require(`../PrefixCommands/${category}/${cmd}`);
      prefixCommands.push(command.name, command);

      client.prefixCommands.set(command.name, command);
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach((alias: any) => {
          client.aliases.set(alias, command.name);
        });
      }
    }
  }
}

async function checkForServers(client: MyClient) {
  const guilds = Object.fromEntries(client.guilds.cache);

  let emptyServers = 0;
  for (const index in guilds) {
    const guild = guilds[index];
    const guildId = guild.id;

    const document = await getServer(guildId);
    if (!document) {
      const foobar = {
        foo: "bar",
      };

      const data = JSON.stringify(foobar);
      insertData({ table: "servers", id: guildId, data });
      emptyServers++;
    }
  }
  console.log(`Found ${emptyServers} servers where no data was found, inserted (wtf am I saying)`);
}

export const name = "ready";
export const execute = async (_: any, client: MyClient) => {
  if (!client.user) return;

  console.log(`Logged in as ${client.user.tag}`);
  await loadSlashCommands(client);
  loadPrefixCommands(client);
  console.log("Loaded commands");
  await checkForServers(client);
};
