import { EmbedBuilder } from "discord.js";
import type { ChatInputCommandInteraction, Client, TextChannel } from "discord.js";
import type { Locales } from "../../Structure/index";

export async function run({ interaction, client, locale }: { interaction: ChatInputCommandInteraction, client: Client, locale: Locales }): Promise<void> {
    await interaction.deferReply();

    const channel = (await client.channels.fetch(Bun.env.DEV_CHANNELID)) as TextChannel | undefined;
    if (!channel) {
        await interaction.editReply(locale.fails.channelDoesntExist);
        return;
    }

    const sender = interaction.user;
    const input = interaction.options.getString("feedback", true);
    const type = interaction.options.getString("type", true);

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Feedback from ${sender.username}`, iconURL: `${sender.avatarURL()}` })
        .addFields(
            { name: `Type: ${type}`, value: input },
            { name: "Message Info", value: `Server: ${interaction.guild?.name}\nLink: https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.id}` }
        );

    await channel.send({ embeds: [embed] });
    await interaction.editReply(locale.misc.feedbackSent);
}
export { data } from "../data/feedback";
