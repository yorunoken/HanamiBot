import { getUser, removeUser } from "../utils/database";
import { linkSlash } from "../utils/constants";
import type { SlashCommand } from "@lilybird/handlers";
import type { ApplicationCommandData, Interaction } from "lilybird";

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;
    await interaction.deferReply(true);

    const userId = interaction.member.user.id;
    const user = getUser(userId);
    if (!user?.banchoId) {
        await interaction.editReply(`You are not linked to the bot! You can link yourself using ${linkSlash}, if you want.`);
        return;
    }

    removeUser(userId);
    await interaction.editReply(`Sad to see you go :(\nYou can always re-link yourself using ${linkSlash}!`);
}

export default {
    post: "GLOBAL",
    data: { name: "unlink", description: "Unlink your osu! account from the bot." },
    run
} satisfies SlashCommand;
