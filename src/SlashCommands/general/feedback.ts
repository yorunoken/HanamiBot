import { ChatInputCommandInteraction, Client, EmbedBuilder, TextChannel } from "discord.js";

export async function run({ interaction, client }: { interaction: ChatInputCommandInteraction; client: Client }) {
  await interaction.deferReply();

  const channel = (await client.channels.fetch(Bun.env.DEV_CHANNEL_ID as string)) as TextChannel;
  if (!channel) {
    return interaction.editReply("This channel doesn't exist.");
  }

  const sender = interaction.user;
  const input = interaction.options.getString("feedback")!;
  const type = interaction.options.getString("type")!;

  channel.send({ embeds: [new EmbedBuilder().setAuthor({ name: `Feedback from ${sender.username}`, iconURL: `${sender.avatarURL}` }).addFields({ name: `Type: ${type}`, value: input })] });
  interaction.editReply("Feedback sent, thank you!");
}
export { data } from "../data/feedback";
