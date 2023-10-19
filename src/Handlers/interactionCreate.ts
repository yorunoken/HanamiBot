import { ChatInputCommandInteraction, InteractionType } from "discord.js";
import { MyClient } from "..";
import { db } from "./ready";

export const name = "interactionCreate";
export const execute = async (interaction: ChatInputCommandInteraction, client: MyClient) => {
  if (interaction.type !== InteractionType.ApplicationCommand || !interaction.guildId) {
    return;
  }

  try {
    const command = client.slashCommands.get(interaction.commandName);
    command.run({ client, interaction, db });
  } catch (e) {
    console.error(e);
    interaction.reply({ content: "There was an error with this interaction. Please try again.", ephemeral: true });
  }
};
