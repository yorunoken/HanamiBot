import { CommandData, MessageCommand, ApplicationCommand } from "@type/commands";

const links = {
    invite: "https://discord.com/oauth2/authorize?client_id=995999045157916763&permissions=346176&scope=bot",
    vote: "https://top.gg/bot/995999045157916763",
};

const inviteString = `You can invite the bot to your server using the following link:\n${links.invite}\nYou can also vote for the bot:\n${links.vote}`;

export async function runMessage({ message }: MessageCommand) {
    await message.reply(inviteString);
}

export async function runApplication({ interaction }: ApplicationCommand) {
    await interaction.reply(inviteString);
}

export const data = {
    name: "invite",
    description: "Get an invite link of the bot.",
    hasPrefixVariant: true,
} satisfies CommandData;
