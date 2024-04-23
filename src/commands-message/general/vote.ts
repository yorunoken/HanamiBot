import type { MessageCommand } from "@type/commands";
import type { Message } from "@lilybird/transformers";

export default {
    name: "vote",
    description: "Vote for the bot.",
    details: "Help me out by voting for my bot in top.gg!",
    usage: "/vote",
    cooldown: 1000,
    run: async ({ message }: { message: Message }) => {
        const voteLink = "https://top.gg/bot/995999045157916763";

        await message.reply({
            content: `You can vote for the bot using the following link:\n${voteLink}`
        });
    }
} satisfies MessageCommand;
