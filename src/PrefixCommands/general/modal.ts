import { Message, ModalBuilder, TextInputStyle, TextInputBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const name = "modal";
export const aliases = ["modal"];
export const cooldown = 3000;
export const description = `Get information of the bot or the commands`;

export async function run({ message, args }: { message: Message; args: string[] }) {
  const button = new ButtonBuilder().setCustomId("myButton").setLabel("Click me!").setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  message.reply({ components: [row as any] });
}
