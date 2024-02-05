import { insertData } from "../utils/database";
import { client, applicationCommands, loadLogs } from "../utils/initalize";
import { EmbedType } from "lilybird";
import type { Interaction } from "lilybird";
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
        return;
    }
    if (interaction.isApplicationCommandInteraction() && interaction.inGuild()) {
        const server = await interaction.client.rest.getGuild(interaction.guildId);
        const { username } = interaction.member.user;

        const commandDefault = applicationCommands.get(interaction.data.name);
        if (!commandDefault) return;
        const { default: command } = commandDefault;

        command.run(interaction).then(async () => {
            await loadLogs(`INFO: [${server.name}] ${username} used slash command \`${command.data.name}\``);
        }).catch(async (error: Error) => {
            await loadLogs(`ERROR: [${server.name}] ${username} had an error in slash command \`${command.data.name}\`: ${error.stack}`, true);
        });
    }
}

export default {
    event: "interactionCreate",
    run
} satisfies Event<"interactionCreate">;
