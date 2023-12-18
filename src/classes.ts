import { buildActionRow, buttonBoolsIndex, buttonBoolsTops, firstButton, lastButton, loadingButtons, nextButton, previousButton, showLessButton, specifyButton } from "./utils";
import { ModalSubmitInteraction } from "discord.js";
import type { CommandInterface, EmbedOptions } from "./Structure/types";
import type { ActionRowBuilder, ButtonInteraction, Message } from "discord.js";

export class ButtonActions {
    private getRow(parameters: Array<boolean | undefined>): Array<ActionRowBuilder> {
        const buttons = [firstButton, previousButton, specifyButton, nextButton, lastButton];
        return [buildActionRow(buttons, parameters)];
    }

    public async handleProfileButtons({ i, options, response }: { i: ButtonInteraction | ModalSubmitInteraction, options: CommandInterface, response: Message }): Promise<void> {
        if (i instanceof ModalSubmitInteraction)
            return;

        await i.update({ components: [loadingButtons] });
        const { pageBuilder } = options;
        if (pageBuilder === undefined) return;
        if (pageBuilder.length < 1) return;

        const pageBuilderArray = pageBuilder as Array<(...args: Array<any>) => any>;
        await response.edit({ embeds: [pageBuilderArray[i.customId === "more" ? 1 : 0](options.options)], components: [showLessButton] });
    }

    public async handleRecentButtons({ pageBuilder, options, i, response }: { pageBuilder: any, options: EmbedOptions, i: ButtonInteraction | ModalSubmitInteraction, response: Message }): Promise<void> {
        const editEmbed = async (): Promise<void> => {
            await response.edit({
                embeds: [await pageBuilder(options)],
                components: this.getRow([
                    options.index === 0,
                    buttonBoolsIndex("previous", options),
                    false,
                    buttonBoolsIndex("next", options),
                    options.plays.length - 1 === options.index
                ])
            });
        };

        if (i instanceof ModalSubmitInteraction) {
            await response.edit({ components: [loadingButtons] });
            await editEmbed();
            return;
        }

        options.index ??= 0;
        await i.update({ components: [loadingButtons] });
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
        }

        await editEmbed();
    }

    public async handleTopsButtons({ pageBuilder, options, i, response }: { pageBuilder: any, options: any, i: ButtonInteraction | ModalSubmitInteraction, response: Message }): Promise<void> {
        async function editEmbed(): Promise<void> {
            await response.edit({
                embeds: [await pageBuilder(options)],
                components: this.getRow([
                    options.page === 0,
                    buttonBoolsTops("previous", options),
                    false,
                    buttonBoolsTops("next", options),
                    (options.index ? options.plays.length - 1 : Math.ceil(options.plays.length / 5) - 1) === options.page
                ])
            });
        }

        if (i instanceof ModalSubmitInteraction) {
            await response.edit({ components: [loadingButtons] });
            await editEmbed();
            return;
        }

        await i.update({ components: [loadingButtons] });
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
        await editEmbed();
    }
}
