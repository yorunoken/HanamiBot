const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const fs = require("fs");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */

async function run(interaction) {
  await interaction.deferReply();
  const name = interaction.options.getString("name");
  if (name) {
  }
  display_commands(interaction);
}

async function display_commands(interaction) {
  const osu = {};
  const admin = {};
  const general = {};
  const replay = {};
  const truth_dare = {};

  const slashFolders = fs.readdirSync("./src/commands/slash");
  for (const folder of slashFolders) {
    const commandFiles = fs.readdirSync(`./src/commands/slash/${folder}`);

    for (const file of commandFiles) {
      const command = require(`../${folder}/${file}`);
      let jsonData;
      try {
        jsonData = JSON.parse(command.data);
      } catch (e) {}
      if (!jsonData && !command.owner) {
        switch (folder) {
          case "osu-slash":
            osu[command.data.name] = command.data.description;
            break;
          case "admin":
            admin[command.data.name] = command.data.description;
            break;
          case "general":
            general[command.data.name] = command.data.description;
            break;
          case "replay":
            replay[command.data.name] = command.data.description;
            break;
          case "truth-dare":
            truth_dare[command.data.name] = command.data.description;
            break;
        }
      }
    }
  }

  let inviteLink = "https://discord.com/api/oauth2/authorize?client_id=995999045157916763&permissions=3263558&scope=bot";
  const embed = new EmbedBuilder().setDescription(`Invite the bot using [this link](${inviteLink})`);
  const categories = [
    { category: "osu", commands: osu },
    { category: "admin", commands: admin },
    { category: "general", commands: general },
    { category: "replay", commands: replay },
    { category: "truth-dare", commands: truth_dare },
  ];

  const filterFor = "osu";
  let filtered = categories.filter((o) => o.category === filterFor);
  filtered.forEach(({ category, commands }) => {
    Object.entries(commands).forEach(([command, description]) => {
      embed.setTitle(`Viewing ${category} commands:`);
      embed.addFields({ name: command, value: description, inline: true });
    });
  });

  interaction.editReply({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get detailed information on a command")
    .addStringOption((o) => o.setName("name").setDescription("The command name. (leave blank to get a list of commands)")),
  run: async ({ interaction }) => {
    run(interaction);
  },
};
