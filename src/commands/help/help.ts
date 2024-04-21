import { helpBuilder } from "@builders/index";
import type { SlashCommand } from "@type/commands";

export default {
    data: { name: "help", description: "Get info about the bot." },
    run: async (interaction) => {
        await interaction.deferReply();

        await interaction.editReply({
            embeds: helpBuilder()
        });
    }
} satisfies SlashCommand;
