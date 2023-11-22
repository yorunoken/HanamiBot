import { ChatInputCommandInteraction, Interaction, InteractionType } from "discord.js";
import { MyClient } from "../classes";
import { db } from "./ready";

export const name = "interactionCreate";
export const execute = async (interaction: Interaction, client: MyClient) => {
  if (!interaction.guildId) {
    return;
  }

  if (interaction.type === InteractionType.MessageComponent) {
    const sillyOptions = client.sillyOptions[interaction.id];
    if (!interaction.isButton() || interaction.user.id !== sillyOptions.initializer.id) {
      return;
    }

    console.log(sillyOptions);
    const { customId, id, user } = interaction;
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    try {
      const command = client.slashCommands.get(interaction.commandName);
      command.run({ client, interaction, db });
    } catch (e) {
      console.error(e);
      interaction.reply({ content: "There was an error with this interaction. Please try again.", ephemeral: true });
    }
  }
};
