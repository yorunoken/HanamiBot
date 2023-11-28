import { ButtonInteraction, Client, Collection, Message, ModalSubmitInteraction } from "discord.js";
import { commandInterface } from "./types";
import { buildActionRow, buttonBoolsIndex, buttonBoolsTops, firstButton, lastButton, loadingButtons, nextButton, previousButton, showLessButton, specifyButton } from "./utils";

export class ButtonActions {
  private static getRow(parameters: boolean[]) {
    const buttons = [firstButton, previousButton, specifyButton, nextButton, lastButton];
    return [buildActionRow(buttons, parameters)] as any;
  }

  static async handleProfileButtons({ i, options, response }: { i: ButtonInteraction | ModalSubmitInteraction; options: any; response: Message }) {
    if (i instanceof ModalSubmitInteraction) {
      return;
    }

    await i.update({ components: [loadingButtons as any] });
    response.edit({ embeds: [options.pageBuilder[i.customId === "more" ? 1 : 0](options.options)], components: [showLessButton as any] });
  }

  static async handleRecentButtons({ pageBuilder, options, i, response }: { pageBuilder: any; options: any; i: ButtonInteraction | ModalSubmitInteraction; response: Message }) {
    const editEmbed = async (options: any) => response.edit({ embeds: [await pageBuilder(options)], components: this.getRow([options.index === 0, buttonBoolsIndex("previous", options), false, buttonBoolsIndex("next", options), options.plays.length - 1 === options.index]) });

    if (i instanceof ModalSubmitInteraction) {
      await response.edit({ components: [loadingButtons as any] });
      await editEmbed(options);
      return;
    }

    await i.update({ components: [loadingButtons as any] });
    switch (i.customId) {
      case "next":
        options.index++;
        break;
      case "previous":
        options.index--;
        break;
      case "last":
        options.index = options.plays.length - 1;
        break;
      case "first":
        options.index = 0;
        break;
    }

    editEmbed(options);
  }

  static async handleTopsButtons({ pageBuilder, options, i, response }: { pageBuilder: any; options: any; i: ButtonInteraction | ModalSubmitInteraction; response: Message }) {
    const editEmbed = async (options: any) => response.edit({ embeds: [await pageBuilder(options)], components: this.getRow([options.page === 0, buttonBoolsTops("previous", options), false, buttonBoolsTops("next", options), (options.index ? options.plays.length - 1 : Math.ceil(options.plays.length / 5) - 1) === options.page]) });

    if (i instanceof ModalSubmitInteraction) {
      await response.edit({ components: [loadingButtons as any] });
      await editEmbed(options);
      return;
    }

    await i.update({ components: [loadingButtons as any] });
    switch (i.customId) {
      case "next":
        options.index++;
        options.page++;
        break;
      case "previous":
        options.index--;
        options.page--;
        break;
      case "last":
        options.index = options.index + 1 ? options.plays.length - 1 : undefined;
        options.page = options.page + 1 ? Math.ceil(options.plays.length / 5) - 1 : undefined;
        break;
      case "first":
        options.index = options.index + 1 ? 0 : undefined;
        options.page = options.page + 1 ? 0 : undefined;
        break;
    }
    await editEmbed(options);
  }
}

export class MyClient extends Client {
  [x: string]: any;
  slashCommands: Collection<any, any>;
  prefixCommands: Collection<any, any>;
  aliases: Collection<any, any>;
  sillyOptions: Record<string, commandInterface>;
  client: any;

  constructor(options: any) {
    super(options);
    this.slashCommands = new Collection();
    this.prefixCommands = new Collection();
    this.aliases = new Collection();
    this.sillyOptions = {};
  }
}
