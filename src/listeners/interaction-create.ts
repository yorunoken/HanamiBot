import type { Event } from "@lilybird/handlers";
import { Interaction } from "@lilybird/transformers";
import { getEntry, insertData } from "database/tools";
import { EmbedType } from "lilybird";
import { Tables } from "types/database/enums";
import { applicationCommands } from "utils/load-commands";
import { log } from "utils/logs";

export default {
    event: "interactionCreate",
    run,
} satisfies Event<"interactionCreate">;

async function run(interaction: Interaction): Promise<void> {
    if (!interaction.isApplicationCommandInteraction() || !interaction.inGuild()) {
        return;
    }

    const { user } = interaction.member;

    const commandDefault = applicationCommands.get(interaction.data.name);
    if (!commandDefault) return;
    const { default: command } = commandDefault;

    try {
        await command.exec(interaction);
        const guild = await interaction.client.rest.getGuild(interaction.guildId);
        await log(`INFO: [${guild.name}] ${user.username} used slash command \`${command.data.name}\`${interaction.data.subCommand ? ` -> \`${interaction.data.subCommand}\`` : ""}`);
    } catch (error) {
        const err = error as Error;

        const guild = await interaction.client.rest.getGuild(interaction.guildId);

        await interaction.reply(`Oops, you came across an error!\nHere's a summary of it:\n\`\`\`${err.stack}\`\`\`\nDon't worry, the same error log has been sent to the owner of this bot.`);
        await interaction.client.rest.createMessage(interaction.channelId, {
            content: `<@${process.env.OWNER_ID}> STACK ERROR, GET YOUR ASS TO WORK`,
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: `Runtime error on command (slash): ${command.data.name}`,
                    fields: [
                        {
                            name: "User",
                            value: `<@${user.id}> (${user.username})`,
                        },
                        {
                            name: "Guild",
                            value: `[${guild.name}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId})`,
                        },
                        {
                            name: "Error",
                            value: err.stack ?? "undefined (look at logs)",
                        },
                    ],
                },
            ],
        });

        console.error(error);
        await log(
            `ERROR: [${guild.name}] ${user.username} had an error in slash command \`${command.data.name}\`${interaction.data.subCommand ? ` -> \`${interaction.data.subCommand}\`` : ""}: ${err.stack}`,
            true,
        );
    }

    const docs = getEntry(Tables.SLASH_COMMANDS, interaction.data.name);
    if (docs === null) insertData({ table: Tables.SLASH_COMMANDS, data: [{ key: "count", value: 1 }], id: command.data.name });
    else insertData({ table: Tables.SLASH_COMMANDS, data: [{ key: "count", value: Number(docs.count ?? 0) + 1 }], id: docs.command_name });
}
