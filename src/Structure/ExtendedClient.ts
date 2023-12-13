import { GuildCreateEvent, InteractionCreateEvent, MessageCreateEvent, ReadyEvent } from "../Events";
import { getServer, getServersInBulk, insertData } from "../utils";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { Client } from "discord.js";
import fs from "fs";
import type { ClientOptions } from "discord.js";
import type { CommandInterface, PrefixCommands, SlashCommands } from "./types";

export default class ExtendedClient extends Client {
    public slashCommands: Map<string, SlashCommands>;
    public prefixCommands: Map<string, PrefixCommands>;
    public aliases: Map<string, string>;
    public localeLanguage: Map<string, string>;
    public sillyOptions: Record<string, CommandInterface>;

    public constructor(options: ClientOptions) {
        super(options);
        this.slashCommands = new Map();
        this.prefixCommands = new Map();
        this.aliases = new Map();
        this.localeLanguage = new Map();
        this.sillyOptions = {};

        this.loadEvents();
    }

    private loadEvents(): void {
        this.on("interactionCreate", async (interaction) => new InteractionCreateEvent(this).execute(interaction));
        this.on("messageCreate", async (message) => new MessageCreateEvent(this).execute(message));
        this.on("guildCreate", async (guild) => new GuildCreateEvent(this).execute(guild));
        this.on("ready", async () => new ReadyEvent(this).execute());
    }

    public async deploy(): Promise<void> {
        await this.loadSlashCmd();
        this.loadPrefixCmd();
        console.log("Loaded commands");
        this.checkServers();
        this.putLanguages();
    }

    public putLanguages(): void {
        const serversId = Array.from(this.guilds.cache.keys());
        const guilds = getServersInBulk(serversId);
        for (const guildId of serversId) {
            const guild = JSON.parse(guilds.find((item: any) => item.id === Number(guildId)).data);
            if (!guild.language)
                insertData({ table: "servers", data: JSON.stringify({ ...JSON.parse(guild.data), language: "en" }), id: guildId });

            this.localeLanguage.set(guildId, guild.language || "en");
        }
    }

    private loadPrefixCmd(): void {
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

    private async loadSlashCmd(): Promise<void> {
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
            await new REST({ version: "10" }).setToken(Bun.env.TOKEN).put(Routes.applicationCommands(this.user.id), { body: slashCommands });
        } catch (error) {
            console.error(error);
        }
    }

    private checkServers(): void {
        const serversId = Array.from(this.guilds.cache.keys());

        let emptyServers = 0;
        for (const guildId of serversId) {
            const document = getServer(guildId);
            if (!document) {
                const foobar = {
                    foo: "bar"
                };

                const data = JSON.stringify(foobar);
                insertData({ table: "servers", id: guildId, data });
                emptyServers++;
            }
        }
        console.log(`Found ${emptyServers} servers where no data was found, inserted (wtf am I saying)`);
    }
}
