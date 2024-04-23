import { helpBuilder } from "@builders/index";
import { ApplicationCommandOptionType } from "lilybird";
import type { SlashCommand } from "@type/commands";

export default {
    data: {
        name: "command",
        description: "Get information about commands.",
        options: [
            {
                name: "name",
                description: "Name of the command you want to get information on.",
                type: ApplicationCommandOptionType.STRING
            }
        ]
    },
    run: async (interaction) => {
        await interaction.deferReply();

        await interaction.editReply({
            embeds: helpBuilder()
        });
    }
} satisfies SlashCommand;
