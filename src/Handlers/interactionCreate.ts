import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, InteractionResponse, InteractionType, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { MyClient, ButtonActions } from "../classes";
import { db } from "./ready";

export const name = "interactionCreate";
export const execute = async (interaction: Interaction, client: MyClient) => {
  if (!interaction.guildId) {
    return;
  }

  if (interaction.isModalSubmit()) {
    const index = interaction.fields.getTextInputValue("index");

    const message = interaction.message;
    if (!message) {
      return;
    }

    await interaction.deferUpdate();
    const sillyOptions = client.sillyOptions[message.id];
    sillyOptions.embedOptions.index = Number(index) - 1;

    if (sillyOptions.buttonHandler) {
      await ButtonActions[sillyOptions.buttonHandler]({ i: interaction, options: sillyOptions.embedOptions, pageBuilder: sillyOptions.pageBuilder, response: sillyOptions.response });
    }
  }

  if (interaction.type === InteractionType.MessageComponent && interaction.isButton()) {
    if (interaction.customId === "myButton") {
      const modal = new ModalBuilder().setCustomId("myModal").setTitle("My Modal");
      const favoriteColorInput = new TextInputBuilder().setCustomId("index").setLabel("Please enter an index value.").setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(favoriteColorInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
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
