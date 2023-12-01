import { ChatInputCommandInteraction, Client, EmbedBuilder, TextChannel } from "discord.js";
import { Locales } from "../../Structure/index";

export async function run({ interaction, client, locale }: { interaction: ChatInputCommandInteraction; client: Client; locale: Locales }) {
  await interaction.deferReply();

  const channel = (await client.channels.fetch(Bun.env.DEV_CHANNEL_ID as string)) as TextChannel;
  if (!channel) {
    return interaction.editReply(locale.fails.channelDoesntExist);
  }

  const sender = interaction.user;
  const input = interaction.options.getString("feedback")!;
  const type = interaction.options.getString("type")!;

  channel.send({ embeds: [new EmbedBuilder().setAuthor({ name: `Feedback from ${sender.username}`, iconURL: `${sender.avatarURL()}` }).addFields({ name: `Type: ${type}`, value: input }, { name: `Message Info`, value: `Server: ${interaction.guild?.name}\nLink: https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.id}` })] });
  interaction.editReply(locale.misc.feedbackSent);
}
export { data } from "../data/feedback";
