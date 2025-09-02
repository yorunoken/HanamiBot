import { getEntry, removeEntry } from "@utils/database";
import { Tables } from "@type/database";
import { CommandData, ApplicationCommand } from "@type/commands";
import { slashCommandIdsCache } from "@utils/cache";

export async function runApplication({ interaction }: ApplicationCommand) {
    await interaction.deferReply(true);

    const linkCommandId = slashCommandIdsCache.get("link");
    const linkCommand = linkCommandId ?? "/link";
    const userId = interaction.member.user.id;
    const user = getEntry(Tables.USER, userId);
    if (!user?.banchoId) {
        await interaction.editReply(`You are not linked to the bot! You can link yourself using ${linkCommand}, if you want.`);
        return;
    }

    removeEntry(Tables.USER, userId);
    await interaction.editReply(`Sad to see you go :(\nYou can always re-link yourself using ${linkCommand}!`);
}

export const data = {
    name: "unlink",
    description: "Unlink your osu! account from the bot.",
    hasPrefixVariant: false,
} satisfies CommandData;
