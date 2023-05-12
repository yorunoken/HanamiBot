const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

async function run(client, interaction) {
  const selfDeaf = true;
  const guildID = interaction.guildId;
  const channel = interaction.options.getChannel("channel");

  const voiceConnection = joinVoiceChannel({ selfDeaf: selfDeaf, guildId: guildID, channelId: channel.id, adapterCreator: interaction.guild.voiceAdapterCreator });
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName("music")
    .setDescription("Configure your music")
    .addSubcommand((command) =>
      command
        .setName("join")
        .setDescription("Joins a channel to play music in")
        .addChannelOption((option) => option.setName("channel").setDescription("Select the channel you want the bot to join").setRequired(true).addChannelTypes(ChannelType.GuildVoice))
    ),
  run: async (client, interaction) => {
    await run(client, interaction);
  },
};
