import { GuildCreateEvent, InteractionCreateEvent, MessageCreateEvent, ReadyEvent } from "../Events";
import { getServer, getServersInBulk, insertData } from "../utils";
import { LocalizationManager } from "../locales";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { Client } from "discord.js";
import { readdir } from "node:fs/promises";
import type { ClientOptions, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
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
        await this.loadPrefixCmd();
        console.log("Loaded commands");
        this.checkServers();
        this.putLanguages();
    }

    public putLanguages(): void {
        const serversId = Array.from(this.guilds.cache.keys());
        const guilds = getServersInBulk(serversId);
        if (!guilds)
            throw new Error("Bot is in no servers.");

        for (const guildId of serversId) {
            const guild = guilds.find((item) => item.id === Number(guildId));
            if (!guild) {
                console.error("Guild cannot be found");
                return;
            }

            this.localeLanguage.set(guildId, guild.language);
        }
    }

    private async loadPrefixCmd(): Promise<void> {
        if (!this.user) return;

        const temp: Array<Promise<PrefixCommands>> = [];

        const items = await readdir("./src/PrefixCommands", { recursive: true });
        for (const item of items) {
            const [category, cmd] = item.split("/");
            if (!category || !cmd) continue;

            const command = import(`../PrefixCommands/${category}/${cmd}`) as Promise<PrefixCommands>;
            temp.push(command);
        }

        const commands = await Promise.all(temp);
        commands.forEach((command) => {
            this.prefixCommands.set(command.name, command);
            command.aliases.forEach((alias) => {
                this.aliases.set(alias, command.name);
            });
        });
    }

    private async loadSlashCmd(): Promise<void> {
        if (!this.user) return;

        const slashCommands: Array<RESTPostAPIChatInputApplicationCommandsJSONBody> = [];
        const temp: Array<Promise<SlashCommands>> = [];

        const items = await readdir("./src/SlashCommands", { recursive: true });
        for (const item of items) {
            const [category, cmd] = item.split("/");
            if (!category || !cmd) continue;
            if (category === "data") continue;

            const command = import(`../SlashCommands/${category}/${cmd}`) as Promise<SlashCommands>;
            temp.push(command);
        }

        const commands = await Promise.all(temp);
        commands.forEach((command) => {
            slashCommands.push(command.data.toJSON());
            this.slashCommands.set(command.data.name, command);
        });

        await new REST({ version: "10" })
            .setToken(Bun.env.TOKEN)
            .put(Routes.applicationCommands(this.user.id), { body: slashCommands })
            .catch((e) => { console.error(e); });
    }

    private checkServers(): void {
        const serversId = Array.from(this.guilds.cache.keys());

        let emptyServers = 0;
        for (const guildId of serversId) {
            const document = getServer(guildId);
            if (!document) {
                insertData({ table: "servers", id: guildId, data: [ { name: "language", value: "en" } ] });
                emptyServers++;
            }
        }
        console.log(`Found ${emptyServers} servers where no data was found, inserted (wtf am I saying)`);
    }
}
