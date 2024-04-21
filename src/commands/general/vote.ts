import type { SlashCommand } from "@type/commands";

export default {
    data: { name: "vote", description: "Vote for the bot." },
    run: async (interaction) => {
        const voteLink = "https://top.gg/bot/995999045157916763";

        await interaction.editReply({
            content: `You can vote for the bot using the following link:\n${voteLink}`
        });
    }
} satisfies SlashCommand;
