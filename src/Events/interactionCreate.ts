import { ButtonActions } from "../classes";
import { LocalizationManager } from "../locales";
import BaseEvent from "../Structure/BaseEvent";
import { getCommand, insertData } from "../utils";
import { db } from "./ready";
import { ActionRowBuilder, EmbedBuilder, InteractionType, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import type { ExtendedClient } from "../Structure";
import type { Interaction, ModalActionRowComponentBuilder } from "discord.js";

export default class InteractionCreateEvent extends BaseEvent {
    public constructor(client: ExtendedClient) {
        super(client);
    }

    public async execute(interaction: Interaction): Promise<void> {
        if (!interaction.guildId)
            return;

        const locale = new LocalizationManager(this.client.localeLanguage.get(interaction.guildId) ?? "en").getLanguage();

        if (interaction.isModalSubmit()) {
            const { message } = interaction;
            if (!message)
                return;

            const sillyOptions = this.client.sillyOptions[message.id];
            if (!sillyOptions.buttonHandler)
                return;

            const index = sillyOptions.embedOptions.index ? Number(interaction.fields.getTextInputValue("index")) : null;
            const page = sillyOptions.buttonHandler === "handleTopsButtons" && !sillyOptions.embedOptions.index ? Number(interaction.fields.getTextInputValue("page")) : null;
            const playsLength = sillyOptions.embedOptions.plays.length;

            if ((index || page)! > (sillyOptions.buttonHandler === "handleRecentButtons" ? playsLength : sillyOptions.embedOptions.index ? playsLength : Math.ceil(playsLength / 5)) || (index || page)! < 0)
                return;

            index ? sillyOptions.embedOptions.index = Number(index) - 1 : null;
            page ? sillyOptions.embedOptions.page = Number(page) - 1 : null;

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
                const modal = new ModalBuilder().setCustomId("myModal").setTitle(locale.modals.enterValue);
                const favoriteColorInput = new TextInputBuilder()
                    .setCustomId(sillyOptions.buttonHandler === "handleRecentButtons" ? "index" : sillyOptions.embedOptions.index ? "index" : "page")
                    .setLabel(locale.modals.valueInsert(sillyOptions.buttonHandler === "handleRecentButtons" ? playsLength : sillyOptions.embedOptions.index ? playsLength : Math.ceil(playsLength / 5)))
                    .setStyle(TextInputStyle.Short);

                const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(favoriteColorInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);
                return;
            }

            if (sillyOptions.buttonHandler)
                await ButtonActions[sillyOptions.buttonHandler]({ i: interaction, options: sillyOptions.embedOptions, pageBuilder: sillyOptions.pageBuilder, response: sillyOptions.response });

            return;
        }

        if (interaction.type === InteractionType.ApplicationCommand) {
            try {
                const cmd = this.client.prefixCommands.get(interaction.commandName)?.name;

                const command = this.client.slashCommands.get(interaction.commandName);
                if (!command) return;
                command.run({ client: this.client, interaction, db, locale }).catch(async (error) => {
                    interaction.editReply(locale.errorAtRuntime);

                    const channel = await this.client.channels.fetch(Bun.env.ERRORS_CHANNELID!);
                    if (!channel || !channel.isTextBased()) return;
                    channel.send({
                        content: `<@${Bun.env.OWNER_DISCORDID}> STACK ERROR, GET YOUR ASS TO WORK`,
                        embeds: [
                            new EmbedBuilder().setTitle(`Runtime error on command: ${cmd}`).setDescription(`Initializer: <@${interaction.user.id}> (${interaction.user.username})\nServer: [${interaction.guild?.name}](https://discord.com/channels/${interaction.guildId}/${interaction.channelId})\nMessage: [Slash command.](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.id})`)
                                .addFields({
                                    name: "Error description:",
                                    value: `\`\`\`${error.stack}\`\`\``
                                })
                        ]
                    });
                });

                if (cmd) {
                    const doc = getCommand(cmd);
                    insertData({ table: "commands", id: cmd, data: doc ? doc.count + 1 : 1 });
                }
            } catch (e) {
                console.error(e);
                interaction.reply({ content: locale.fails.interactionError, ephemeral: true });
            }
            return;
        }
    }
}