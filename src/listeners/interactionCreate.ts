import { insertData } from "../utils/database";
import { v2 } from "osu-api-extended";
import { EmbedType } from "lilybird";
import type { Interaction } from "lilybird";
import type { Event } from "@lilybird/handlers";

async function run(interaction: Interaction): Promise<void> {
    if (interaction.isMessageComponentInteraction()) {
        if (interaction.data.id === "verify") {
            await interaction.deferReply(true);

            const { embeds, author } = interaction.message;
            const messageEmbed = embeds?.[0];
            if (!messageEmbed || author.id !== interaction.client.user.id) return;

            const { fields } = messageEmbed;
            if (!fields) return;

            const discordId = fields[0].value;
            const osuId = fields[1].value;

            const user = await v2.user.details(osuId);
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

            await interaction.editReply({ embeds: [embed] });
        }
    }
}

export default {
    event: "interactionCreate",
    run
} satisfies Event<"interactionCreate">;
