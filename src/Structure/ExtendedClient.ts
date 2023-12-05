import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { Client, ClientOptions, Constants } from "discord.js";
import fs from "fs";
import { GuildCreateEvent, InteractionCreateEvent, MessageCreateEvent, ReadyEvent } from "../Events";
import { getServer, getServersInBulk, insertData } from "../utils";
import { commandInterface, PrefixCommands, SlashCommands } from "./types";

export default class extends Client {
  slashCommands: Map<string, SlashCommands>;
  prefixCommands: Map<string, PrefixCommands>;
  aliases: Map<string, string>;
  localeLanguage: Map<string, string>;
  sillyOptions: Record<string, commandInterface>;

  constructor(options: ClientOptions) {
    super(options);
    this.slashCommands = new Map();
    this.prefixCommands = new Map();
    this.aliases = new Map();
    this.localeLanguage = new Map();
    this.sillyOptions = {};

    this.loadEvents();
  }

  private loadEvents() {
    this.on("interactionCreate", (interaction) => new InteractionCreateEvent(this).execute(interaction));
    this.on("messageCreate", (message) => new MessageCreateEvent(this).execute(message));
    this.on("guildCreate", (guild) => new GuildCreateEvent(this).execute(guild));
    this.on("ready", () => new ReadyEvent(this).execute());
  }

  public async deploy() {
    await this.loadSlashCmd();
    this.loadPrefixCmd();
    console.log("Loaded commands");
    await this.checkServers();
    await this.putLanguages();
  }

  public async putLanguages() {
    const serversId = Array.from(this.guilds.cache.keys());
    const guilds = getServersInBulk(serversId);
    for (const guildId of serversId) {
      const guild = JSON.parse(guilds.find((item: any) => item.id === Number(guildId)).data);
      if (!guild.language) {
        insertData({ table: "servers", data: JSON.stringify({ ...JSON.parse(guild.data), language: "en" }), id: guildId });
      }
      this.localeLanguage.set(guildId, guild.language || "en");
    }
  }

  private loadPrefixCmd() {
    if (!this.user) return;

    const prefixCommands = [];
    const commandsCategories = fs.readdirSync("./src/PrefixCommands");
    for (const category of commandsCategories) {
      if (category === "data") continue;
      const commands = fs.readdirSync(`./src/PrefixCommands/${category}`);

      for (const cmd of commands) {
        const command = require(`../PrefixCommands/${category}/${cmd}`);
        prefixCommands.push(command.name, command);

        this.prefixCommands.set(command.name, command);
        if (command.aliases && Array.isArray(command.aliases)) {
          command.aliases.forEach((alias: any) => {
            this.aliases.set(alias, command.name);
          });
        }
      }
    }
  }

  private async loadSlashCmd() {
    if (!this.user) return;

    const slashCommands: any = [];
    const commandsCategories = fs.readdirSync("./src/SlashCommands");
    for (const category of commandsCategories) {
      if (category === "data") continue;
      const commands = fs.readdirSync(`./src/SlashCommands/${category}`);

      for (const cmd of commands) {
        const command = require(`../SlashCommands/${category}/${cmd}`);
        slashCommands.push(command.data.toJSON());

        this.slashCommands.set(command.data.name, command);
      }
    }

    try {
      await new REST({ version: "10" }).setToken(Bun.env.TOKEN as string).put(Routes.applicationCommands(this.user.id), { body: slashCommands });
    } catch (error) {
      console.error(error);
    }
  }

  private async checkServers() {
    const serversId = Array.from(this.guilds.cache.keys());

    let emptyServers = 0;
    for (const guildId of serversId) {
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
}
