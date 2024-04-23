import type { MessageCommand } from "@type/commands";

export default {
    name: "vote",
    description: "Vote for the bot.",
    details: "Help me out by voting for my bot in top.gg!",
    usage: "/vote",
    cooldown: 1000,
    run: async ({ message }) => {
        const voteLink = "https://top.gg/bot/995999045157916763";

        await message.reply({
            content: `You can vote for the bot using the following link:\n${voteLink}`
        });
    }
} satisfies MessageCommand;
