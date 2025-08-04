import type { SlashCommand } from "@type/commands";

export default {
    data: { name: "invite", description: "Get an invite link of the bot." },
    run: async (interaction) => {
        const links = {
            invite: "https://discord.com/oauth2/authorize?client_id=995999045157916763&permissions=265216&scope=bot",
            vote: "https://top.gg/bot/995999045157916763",
        };

        await interaction.editReply({
            content: `You can invite the bot to your server using the following link:\n${links.invite}\nYou can also vote for the bot:\n${links.vote}`,
        });
    },
} satisfies SlashCommand;
