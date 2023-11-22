import { ChatInputCommandInteraction, Interaction, InteractionType } from "discord.js";
import { MyClient, ButtonActions } from "../classes";
import { db } from "./ready";

export const name = "interactionCreate";
export const execute = async (interaction: Interaction, client: MyClient) => {
  if (!interaction.guildId) {
    return;
  }

  if (interaction.type === InteractionType.MessageComponent) {
    if (!interaction.isButton()) {
      return;
    }
    const message = interaction.message;
    const sillyOptions = client.sillyOptions[message.id];
    if (sillyOptions.buttonHandler) {
      await ButtonActions[sillyOptions.buttonHandler]({ i: interaction, options: sillyOptions.embedOptions, pageBuilder: sillyOptions.pageBuilder, response: sillyOptions.response });
    }
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
