import { getEntry, removeEntry } from "@utils/database";
import { slashCommandsIds } from "@utils/cache";
import { Tables } from "@type/database";
import type { SlashCommand } from "@type/commands";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";

export default {
    data: { name: "unlink", description: "Unlink your osu! account from the bot." },
    run
} satisfies SlashCommand;

async function run(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply(true);

    const linkCommand = slashCommandsIds.get("link");
    const userId = interaction.member.user.id;
    const user = getEntry(Tables.USER, userId);
    if (!user?.banchoId) {
        await interaction.editReply(`You are not linked to the bot! You can link yourself using ${linkCommand}, if you want.`);
        return;
    }

    removeEntry(Tables.USER, userId);
    await interaction.editReply(`Sad to see you go :(\nYou can always re-link yourself using ${linkCommand}!`);
}
