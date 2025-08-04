import { helpBuilder } from "@builders/index";
import { ApplicationCommandOptionType } from "lilybird";
import type { SlashCommand } from "@type/commands";

export default {
    data: {
        name: "help",
        description: "Get help about the bot or specific commands.",
        options: [
            {
                name: "command",
                description: "Name of the command you want to get information on.",
                type: ApplicationCommandOptionType.STRING,
                required: false,
            },
        ],
    },
    run: async (interaction) => {
        await interaction.deferReply();

        const commandName = interaction.data.getString("command");
        await interaction.editReply({
            embeds: helpBuilder(commandName),
        });
    },
} satisfies SlashCommand;
