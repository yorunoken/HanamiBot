import { insertData } from "../utils/database";
import { client, applicationCommands, loadLogs } from "../utils/initalize";
import { mesageDataForButtons } from "../utils/cache";
import { compareBuilder, leaderboardBuilder, mapBuilder, playBuilder, profileBuilder } from "../embed-builders";
import { EmbedBuilderType } from "../types/embedBuilders";
import { EmbedType } from "lilybird";
import type { EmbedStructure, Interaction } from "lilybird";
import type { Event } from "@lilybird/handlers";

async function run(interaction: Interaction): Promise<void> {
    if (interaction.isMessageComponentInteraction()) {
        if (interaction.data.id === "verify" && interaction.inDM()) {
            await interaction.deferReply(true);

            const { username } = interaction.user;
            const { embeds, author } = interaction.message;
            const messageEmbed = embeds?.[0];
            if (!messageEmbed || author.id !== interaction.client.user.id) return;

            const { fields } = messageEmbed;
            if (!fields) return;

            const discordId = fields[0].value;
            const osuId = fields[1].value;

            const user = await client.users.getUser(osuId);
            if (!user.id) {
                await interaction.editReply("It seems like this a user with this osu! ID doesn't exist.. might be a banned user...");
                return;
            }

            insertData({ table: "users", id: discordId, data: [ { name: "banchoId", value: osuId } ] });

            const embed = {
                type: EmbedType.Rich,
                title: "Success!",
                description: `Successfully linked <@${discordId}> with ${user.username}`,
                children: { data: { url: user.avatar_url }, type: "thumbnail" }
            };

            interaction.editReply({ embeds: [embed] }).then(async () => {
                await loadLogs(`INFO: [Private Messages] ${username} linked their osu! account, \`${osuId}\``);
            }).catch(async (error: Error) => {
                await loadLogs(`ERROR: [Private Messages] ${username} had an error while linking their osu! account, \`${discordId}\`: ${error.stack}`, true);
            });
        }
        if (!interaction.inGuild()) return;

        console.log(interaction.message.id);
        const builderOptions = mesageDataForButtons.get(interaction.message.id);
        console.log(builderOptions);
        if (typeof builderOptions === "undefined") return;

        const isIncrementPage = interaction.data.id === "increment-page";
        const isDecrementPage = interaction.data.id === "decrement-page";
        const isIncrementIndex = interaction.data.id === "increment-index";
        const isDecrementIndex = interaction.data.id === "decrement-index";

        const isMaxPage = interaction.data.id === "max-page";
        const isMinPage = interaction.data.id === "min-page";
        const isMaxIndex = interaction.data.id === "max-index";
        const isMinIndex = interaction.data.id === "min-index";

        let embeds: Array<EmbedStructure>;
        switch (builderOptions.builderType) {
            case EmbedBuilderType.COMPARE:
                embeds = await compareBuilder(builderOptions);
                break;
            case EmbedBuilderType.LEADERBOARD:
                if (isIncrementPage) {
                    builderOptions.page ??= 0;
                    builderOptions.page += 1;
                } else if (isDecrementPage) {
                    builderOptions.page ??= 0;
                    builderOptions.page -= 1;
                } else if (isMaxPage)
                    builderOptions.isMaxValue = true;
                else if (isMinPage)
                    builderOptions.isMinValue = true;

                embeds = await leaderboardBuilder(builderOptions);
                break;
            case EmbedBuilderType.MAP:
                embeds = await mapBuilder(builderOptions);
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
                } else if (isMaxPage || isMaxIndex)
                    builderOptions.isMaxValue = true;
                else if (isMinPage || isMinIndex)
                    builderOptions.isMinValue = true;

                embeds = await playBuilder(builderOptions);
                break;
            case EmbedBuilderType.PROFILE:
                embeds = profileBuilder(builderOptions);
                break;
        }

        await interaction.updateComponents({ embeds });
        return;
    }
    if (interaction.isApplicationCommandInteraction() && interaction.inGuild()) {
        const server = await interaction.client.rest.getGuild(interaction.guildId);
        const { username } = interaction.member.user;

        const commandDefault = applicationCommands.get(interaction.data.name);
        if (!commandDefault) return;
        const { default: command } = commandDefault;

        command.run(interaction).then(async () => {
            await loadLogs(`INFO: [${server.name}] ${username} used slash command \`${command.data.name}\`${interaction.data.subCommand ? ` -> \`${interaction.data.subCommand}\`` : ""}`);
        }).catch(async (error: Error) => {
            await loadLogs(
                `ERROR: [${server.name}] ${username} had an error in slash command \`${command.data.name}\`${interaction.data.subCommand ? ` -> \`${interaction.data.subCommand}\`` : ""}: ${error.stack}`,
                true
            );
        });
    }
}

export default {
    event: "interactionCreate",
    run
} satisfies Event<"interactionCreate">;
