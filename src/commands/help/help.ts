import { helpBuilder } from "@builders/help";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    data: { name: "help", description: "Get info about the bot." },
    run: async (interaction) => {
        await interaction.deferReply();
        await interaction.editReply({
            embeds: helpBuilder()
        });
    }
} satisfies SlashCommand;
