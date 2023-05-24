const { EmbedBuilder } = require("discord.js");

async function run(message, args, client) {
  const res = args.match(/\d+/);
  const id = res ? res[0] : message.author.id;

  const user = await client.users.fetch(id.toString());
  const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`;
  const embed = new EmbedBuilder().setAuthor({ name: `Avatar of ${user.username}#${user.discriminator}`, url: avatarURL }).setImage(avatarURL);
  message.channel.send({ embeds: [embed] });
}

module.exports = {
  name: "avatar",
  aliases: ["avatar"],
  cooldown: 5000,
  run: async ({ message, args, client }) => {
    await run(message, args.join(""), client);
  },
};
