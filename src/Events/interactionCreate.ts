import { ActionRowBuilder, Interaction, InteractionType, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { ButtonActions } from "../classes";
import { ExtendedClient } from "../Structure";
import BaseEvent from "../Structure/BaseEvent";
import { db } from "./ready";

export default class InteractionCreateEvent extends BaseEvent {
  constructor(client: ExtendedClient) {
    super(client);
  }

  public async execute(interaction: Interaction): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    const locale = await import(`../locales/${this.client.localeLanguage.get(interaction.guildId) ?? "en"}.json`);

    if (interaction.isModalSubmit()) {
      const message = interaction.message;
      if (!message) {
        return;
      }
      const sillyOptions = this.client.sillyOptions[message.id];
      if (!sillyOptions.buttonHandler) {
        return;
      }

      const index = sillyOptions.embedOptions.index ? Number(interaction.fields.getTextInputValue("index")) : null;
      const page = sillyOptions.buttonHandler === "handleTopsButtons" && !sillyOptions.embedOptions.index ? Number(interaction.fields.getTextInputValue("page")) : null;
      const playsLength = sillyOptions.embedOptions.plays.length;

      if ((index || page)! > (sillyOptions.buttonHandler === "handleRecentButtons" ? playsLength : sillyOptions.embedOptions.index ? playsLength : Math.ceil(playsLength / 5)) || (index || page)! < 0) {
        return;
      }

      index ? (sillyOptions.embedOptions.index = Number(index) - 1) : null;
      page ? (sillyOptions.embedOptions.page = Number(page) - 1) : null;

      await interaction.deferUpdate();
      await ButtonActions[sillyOptions.buttonHandler]({ i: interaction, options: sillyOptions.embedOptions, pageBuilder: sillyOptions.pageBuilder, response: sillyOptions.response });
      return;
    }

    if (interaction.type === InteractionType.MessageComponent && interaction.isButton()) {
      const sillyOptions = this.client.sillyOptions[interaction.message.id];

      if (interaction.user.id !== sillyOptions.initializer.id) {
        interaction.reply({ ephemeral: true, content: locale.fails.userButtonNotAllowed });
        return;
      }

      if (interaction.customId === "indexbtn") {
        const playsLength = sillyOptions.embedOptions.plays.length;
        const modal = new ModalBuilder().setCustomId("myModal").setTitle("Enter a value");
        const favoriteColorInput = new TextInputBuilder()
          .setCustomId(sillyOptions.buttonHandler === "handleRecentButtons" ? "index" : sillyOptions.embedOptions.index ? "index" : "page")
          .setLabel(locale.modals.valueInsert.replace("{MAXVALUE}", sillyOptions.buttonHandler === "handleRecentButtons" ? playsLength : sillyOptions.embedOptions.index ? playsLength : Math.ceil(playsLength / 5)))
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(favoriteColorInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
        return;
      }

      if (sillyOptions.buttonHandler) {
        await ButtonActions[sillyOptions.buttonHandler]({ i: interaction, options: sillyOptions.embedOptions, pageBuilder: sillyOptions.pageBuilder, response: sillyOptions.response });
      }
      return;
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      try {
        const command = this.client.slashCommands.get(interaction.commandName);
        if (!command) return;
        command.run({ client: this.client, interaction, db, locale });
      } catch (e) {
        console.error(e);
        interaction.reply({ content: locale.fails.interactionError, ephemeral: true });
      }
      return;
    }
  }
}
