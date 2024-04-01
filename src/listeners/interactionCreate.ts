import { compareBuilder, leaderboardBuilder, mapBuilder, playBuilder, profileBuilder } from "../embed-builders";
import { getCommand, insertData } from "@utils/database";
import { client, applicationCommands, loadLogs } from "@utils/initalize";
import { mesageDataForButtons } from "@utils/cache";
import { EmbedBuilderType } from "@type/embedBuilders";
import { calculateButtonState, createActionRow } from "@utils/buttons";
import { backgroundBuilder } from "@builders/background";
import { avatarBuilder } from "@builders/avatar";
import type { DMInteraction, Interaction, InteractionReplyOptions, Message, MessageComponentData } from "@lilybird/transformers";
import type { EmbedStructure } from "lilybird";
import type { Event } from "@lilybird/handlers";

export default {
    event: "interactionCreate",
    run
} satisfies Event<"interactionCreate">;

async function run(interaction: Interaction): Promise<void> {
    await handleButton(interaction);
    if (interaction.isApplicationCommandInteraction() && interaction.inGuild()) {
        const server = await interaction.client.rest.getGuild(interaction.guildId);
        const { username } = interaction.member.user;

        const commandDefault = applicationCommands.get(interaction.data.name);
        if (!commandDefault) return;
        const { default: command } = commandDefault;

        try {
            await command.run(interaction);
            await loadLogs(`INFO: [${server.name}] ${username} used slash command \`${command.data.name}\`${interaction.data.subCommand ? ` -> \`${interaction.data.subCommand}\`` : ""}`);

            const docs = getCommand(interaction.data.name);
            if (docs === null)
                insertData({ table: "commands_slash", data: [ { name: "count", value: 1 } ], id: command.data.name });
            else
                insertData({ table: "commands_slash", data: [ { name: "count", value: Number(docs.count ?? 0) + 1 } ], id: docs.id });
        } catch (error) {
            const err = error as Error;
            console.log(error);
            await loadLogs(
                `ERROR: [${server.name}] ${username} had an error in slash command \`${command.data.name}\`${interaction.data.subCommand ? ` -> \`${interaction.data.subCommand}\`` : ""}: ${err.stack}`,
                true
            );

            const docs = getCommand(interaction.data.name);
            if (docs === null)
                insertData({ table: "commands_slash", data: [ { name: "count", value: 1 } ], id: command.data.name });
            else
                insertData({ table: "commands_slash", data: [ { name: "count", value: Number(docs.count ?? 0) + 1 } ], id: docs.id });
        }
    }
}

async function handleButton(interaction: Interaction): Promise<void> {
    if (!interaction.isMessageComponentInteraction() || !interaction.data.isButton()) return;
    if (interaction.inDM()) return handleVerify(interaction);
    if (!interaction.inGuild()) return;

    const builderOptions = mesageDataForButtons.get(interaction.message.id);
    if (typeof builderOptions === "undefined") {
        await interaction.reply({ ephemeral: true, content: "This button will not work because the message was created before a bot restart, so its data has been lost." });
        return;
    }

    if (builderOptions.initiatorId !== interaction.member.user.id) {
        await interaction.reply({ ephemeral: true, content: "You need to be the person who initialized the command to be able to click the buttons." });
        return;
    }

    // This is hard-types like this because the buttons are not going to be clickable anyways.
    await interaction.updateComponents({ components: createActionRow({ isPage: true, disabledStates: [true, true, true, true] }) });

    // Display an error message because I'm dumb and haven't programmed this yet.
    if (interaction.data.id === "wildcard-page" || interaction.data.id === "wildcard-index") {
        await interaction.reply({ ephemeral: true, content: "This feature has not been implemented yet." });
        return;
    }

    const isIncrementPage = interaction.data.id === "increment-page";
    const isDecrementPage = interaction.data.id === "decrement-page";
    const isIncrementIndex = interaction.data.id === "increment-index";
    const isDecrementIndex = interaction.data.id === "decrement-index";

    const isMaxPage = interaction.data.id === "max-page";
    const isMinPage = interaction.data.id === "min-page";
    const isMaxIndex = interaction.data.id === "max-index";
    const isMinIndex = interaction.data.id === "min-index";

    const options: InteractionReplyOptions = {};
    switch (builderOptions.type) {
        case EmbedBuilderType.AVATAR:
            options.embeds = avatarBuilder(builderOptions);
            break;
        case EmbedBuilderType.BACKGROUND:
            options.embeds = backgroundBuilder(builderOptions);
            break;
        case EmbedBuilderType.COMPARE:
            options.embeds = await compareBuilder(builderOptions);
            break;
        case EmbedBuilderType.PROFILE:
            options.embeds = profileBuilder(builderOptions);
            break;
        case EmbedBuilderType.MAP:
            options.embeds = await mapBuilder(builderOptions);
            break;
        case EmbedBuilderType.LEADERBOARD:
            if (isIncrementPage) {
                builderOptions.page ??= 0;
                builderOptions.page += 1;
            } else if (isDecrementPage) {
                builderOptions.page ??= 0;
                builderOptions.page -= 1;
            } else if (isMaxPage)
                builderOptions.page = Math.ceil(builderOptions.scores.length / 5) - 1;
            else if (isMinPage)
                builderOptions.page = 0;

            const totalPage = builderOptions.scores.length;

            options.components = createActionRow({
                isPage: true,
                disabledStates: [
                    (builderOptions.page ?? 0) === 0,
                    calculateButtonState(false, builderOptions.page ?? 0, totalPage),
                    calculateButtonState(true, builderOptions.page ?? 0, totalPage),
                    (builderOptions.page ?? 0) * 5 + 5 === totalPage
                ]
            });

            options.embeds = await leaderboardBuilder(builderOptions);
            break;
        case EmbedBuilderType.PLAYS:
            if (isIncrementPage) {
                builderOptions.page ??= 0;
                builderOptions.page += 1;
            } else if (isDecrementPage) {
                builderOptions.page ??= 0;
                builderOptions.page -= 1;
            } else if (isIncrementIndex) {
                builderOptions.index ??= 0;
                builderOptions.index += 1;
            } else if (isDecrementIndex) {
                builderOptions.index ??= 0;
                builderOptions.index -= 1;
            } else if (isMaxPage || isMaxIndex) {
                if (builderOptions.isPage === true)
                    builderOptions.page = Math.ceil(builderOptions.plays.length / 5) - 1;
                else builderOptions.index = Math.ceil(builderOptions.plays.length) - 1;
            } else if (isMinPage || isMinIndex) {
                if (builderOptions.isPage === true)
                    builderOptions.page = 0;
                else builderOptions.index = 0;
            }

            if (builderOptions.isPage === true) {
                const totalPages = Math.ceil(builderOptions.plays.length / 5);
                options.components = createActionRow({
                    isPage: builderOptions.isPage,
                    disabledStates: [
                        (builderOptions.page ?? 0) === 0,
                        calculateButtonState(false, builderOptions.page ?? 0, totalPages),
                        calculateButtonState(true, builderOptions.page ?? 0, totalPages),
                        (builderOptions.page ?? 0) === totalPages - 1
                    ]
                });
            } else {
                const totalPages = Math.ceil(builderOptions.plays.length);
                options.components = createActionRow({
                    isPage: false,
                    disabledStates: [
                        (builderOptions.index ?? 0) === 0,
                        calculateButtonState(false, builderOptions.index ?? 0, totalPages),
                        calculateButtonState(true, builderOptions.index ?? 0, totalPages),
                        (builderOptions.index ?? 0) === totalPages - 1
                    ]
                });
            }

            options.embeds = await playBuilder(builderOptions);
            break;
    }

    await interaction.editReply(options);
    return;
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

    insertData({ table: "users", id: discordId, data: [ { name: "banchoId", value: osuId } ] });

    const embed: EmbedStructure = {
        title: "Success!",
        description: `Successfully linked <@${discordId}> with ${osuUser.username}`,
        thumbnail: { url: osuUser.avatar_url }
    };

    interaction.editReply({ embeds: [embed], components: [] }).then(async () => {
        await loadLogs(`INFO: [Private Messages] ${username} linked their osu! account, \`${osuId}\``);
    }).catch(async (error: Error) => {
        console.log(error);
        await loadLogs(`ERROR: [Private Messages] ${username} had an error while linking their osu! account, \`${discordId}\`: ${error.stack}`, true);
    });
}

