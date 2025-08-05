import type { MessageCommand } from "@type/commands";

export default {
    name: "invite",
    description: "Gives you an invite link of the bot.",
    usage: "/invite",
    cooldown: 1000,
    run: async ({ message }) => {
        const links = {
            invite: "https://discord.com/oauth2/authorize?client_id=995999045157916763&permissions=346176&scope=bot",
            vote: "https://top.gg/bot/995999045157916763",
        };

        await message.reply({
            content: `You can invite the bot to your server using the following link:\n${links.invite}\nYou can also vote for the bot:\n${links.vote}`,
        });
    },
} satisfies MessageCommand;
