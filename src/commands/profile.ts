import { ApplicationCommandOptionType } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    data: {
        name: "profile",
        description: "Display statistics of a user.",
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "username",
                description: "Specify an osu! username",
                choices: [ { name: "osu", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "ctb", value: "fruits" } ]
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "discord",
                description: "Specify an osu! username"
            }
        ]
    },
    run: async (interaction) => {
        await interaction.deferReply();

        const { ws, rest } = await interaction.client.ping();

        await interaction.editReply({
            content: `🏓 WebSocket: \`${ws}ms\` | Rest: \`${rest}ms\``
        });
    }
} satisfies SlashCommand;
