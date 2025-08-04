import { getEntry, insertData } from "@utils/database";
import { client, applicationCommands } from "@utils/initalize";
import { logger } from "@utils/logger";
import { ButtonStateCache } from "@utils/cache";
import { EmbedBuilderType } from "@type/embedBuilders";
import { createPaginationActionRow } from "@utils/pagination";
import { PaginationManager } from "@utils/pagination";
import { Tables } from "@type/database";
import { leaderboardBuilder, playBuilder } from "@builders/index";
import { EmbedType } from "lilybird";
import type { Embed } from "lilybird";
import type { DMInteraction, Interaction, InteractionReplyOptions, Message, MessageComponentData } from "@lilybird/transformers";
import type { Event } from "@lilybird/handlers";
import type { EmbedBuilderOptions } from "@type/embedBuilders";

export default {
    event: "interactionCreate",
    run,
} satisfies Event<"interactionCreate">;

async function run(interaction: Interaction): Promise<void> {
    await handleButton(interaction);
    if (interaction.isApplicationCommandInteraction() && interaction.inGuild()) {
        const { user } = interaction.member;

        const commandDefault = applicationCommands.get(interaction.data.name);
        if (!commandDefault) return;
        const { default: command } = commandDefault;

        try {
            await command.run(interaction);
            const guild = await interaction.client.rest.getGuild(interaction.guildId);
            await logger.info(`[${guild.name}] ${user.username} used slash command \`${command.data.name}\`${interaction.data.subCommand ? ` -> \`${interaction.data.subCommand}\`` : ""}`, {
                guildId: interaction.guildId,
                guildName: guild.name,
                userId: user.id,
                username: user.username,
                command: command.data.name,
                subCommand: interaction.data.subCommand,
            });

            const docs = getEntry(Tables.COMMAND_SLASH, interaction.data.name);
            if (docs === null) insertData({ table: Tables.COMMAND_SLASH, data: [{ key: "count", value: 1 }], id: command.data.name });
            else insertData({ table: Tables.COMMAND_SLASH, data: [{ key: "count", value: Number(docs.count ?? 0) + 1 }], id: docs.id });
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

            await logger.error(`[${guild.name}] ${user.username} had an error in slash command \`${command.data.name}\`${interaction.data.subCommand ? ` -> \`${interaction.data.subCommand}\`` : ""}`, err, {
                guildId: interaction.guildId,
                guildName: guild.name,
                userId: user.id,
                username: user.username,
                command: command.data.name,
                subCommand: interaction.data.subCommand,
            });

            const docs = getEntry(Tables.COMMAND_SLASH, interaction.data.name);
            if (docs === null) insertData({ table: Tables.COMMAND_SLASH, data: [{ key: "count", value: 1 }], id: command.data.name });
            else insertData({ table: Tables.COMMAND_SLASH, data: [{ key: "count", value: Number(docs.count ?? 0) + 1 }], id: docs.id });
        }
    }
}

async function handleButton(interaction: Interaction): Promise<void> {
    if (!interaction.isMessageComponentInteraction() || !interaction.data.isButton()) return;
    if (interaction.inDM()) return handleVerify(interaction);
    if (!interaction.inGuild()) return;

    const builderOptions = await ButtonStateCache.get<EmbedBuilderOptions>(interaction.message.id);
    if (builderOptions === null || builderOptions === undefined) {
        await interaction.reply({ ephemeral: true, content: "This button will not work because the message was created before a bot restart, so its data has been lost." });
        return;
    }

    if (builderOptions.initiatorId !== interaction.member.user.id) {
        await interaction.reply({ ephemeral: true, content: "You need to be the person who initialized the command to be able to click the buttons." });
        return;
    }

    // Temporarily disable all buttons during processing
    await interaction.updateComponents({
        components: [
            {
                type: 1,
                components: [
                    { type: 2, style: 1, custom_id: "disabled", label: "<<", disabled: true },
                    { type: 2, style: 1, custom_id: "disabled", label: "<", disabled: true },
                    { type: 2, style: 1, custom_id: "disabled", label: ">", disabled: true },
                    { type: 2, style: 1, custom_id: "disabled", label: ">>", disabled: true },
                ],
            },
        ],
    });

    if (interaction.data.id === "wildcard-page" || interaction.data.id === "wildcard-index") {
        await interaction.reply({ ephemeral: true, content: "This feature has not been implemented yet." });
        return;
    }

    const buttonAction = PaginationManager.parseButtonAction(interaction.data.id);
    if (!buttonAction) {
        await interaction.reply({ ephemeral: true, content: "Unknown button action." });
        return;
    }

    const updatedOptions = PaginationManager.updateBuilderOptions(builderOptions, buttonAction.action, buttonAction.type);

    await ButtonStateCache.set(interaction.message.id, updatedOptions);

    const options: InteractionReplyOptions = {};

    // Build the appropriate embed
    switch (updatedOptions.type) {
        case EmbedBuilderType.LEADERBOARD:
            options.embeds = await leaderboardBuilder(updatedOptions as any);
            break;
        case EmbedBuilderType.PLAYS:
            options.embeds = await playBuilder(updatedOptions as any);
            break;
        default:
            await interaction.reply({ ephemeral: true, content: "Unsupported builder type for pagination." });
            return;
    }

    // Create the action row with proper disabled states
    options.components = createPaginationActionRow(updatedOptions);

    await interaction.editReply(options);
}

async function handleVerify(interaction: DMInteraction<MessageComponentData, Message>): Promise<void> {
    await interaction.deferComponentReply(true);
    const { username } = interaction.user;
    const messageEmbed = interaction.message.embeds?.[0];

    if (typeof messageEmbed === "undefined") {
        await interaction.editReply("Something went wrong, try again dumbo");
        return;
    }

    const { fields } = messageEmbed;
    if (!fields) return;

    const discordId = fields[0].value;
    const osuId = fields[1].value;
    const osuUser = await client.users.getUser(osuId);

    if (!osuUser.id) {
        await interaction.editReply("It seems like a user with this osu! ID doesn't exist.. might be a banned user...");
        return;
    }

    insertData({ table: Tables.USER, id: discordId, data: [{ key: "banchoId", value: osuId }] });

    const embed: Embed.Structure = {
        title: "Success!",
        description: `Successfully linked <@${discordId}> with ${osuUser.username}`,
        thumbnail: { url: osuUser.avatar_url },
    };

    interaction
        .editReply({ embeds: [embed], components: [] })
        .then(async () => {
            await logger.info(`[Private Messages] ${username} linked their osu! account`, {
                username,
                discordId,
                osuId,
                osuUsername: osuUser.username,
            });
        })
        .catch(async (error: Error) => {
            await logger.error(`[Private Messages] ${username} had an error while linking their osu! account`, error, {
                username,
                discordId,
                osuId,
            });
        });
}
