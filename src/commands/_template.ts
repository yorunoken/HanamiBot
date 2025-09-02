import { CommandData, MessageCommand, ApplicationCommand } from "@type/commands";

export async function runMessage({ message }: MessageCommand) {
    // Code here
    await message.reply("Hello, world!");
}

export async function runApplication({ interaction }: ApplicationCommand) {
    // Code here
    await interaction.reply("Hello, world!");
}

export const data = {
    name: "example",
    description: "An example command.",
    hasPrefixVariant: true, // set to false if there's no prefix command for this.
} satisfies CommandData;
