import type { ChatInputCommandInteraction } from "discord.js";

export async function run({ interaction }: { interaction: ChatInputCommandInteraction }): Promise<void> {
    await interaction.deferReply();

    const timeNow = Date.now();
    const response = await interaction.editReply("Pong! 🏓");
    const ms = Date.now() - timeNow;
    await response.edit(`Pong! 🏓(${ms}ms)`);
}
export { data } from "../data/ping";
