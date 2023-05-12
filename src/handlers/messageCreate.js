const { Collection } = require("discord.js");
const ms = require("ms");
const cooldown = new Collection();

module.exports = {
  name: "messageCreate",
  execute: async (message, db) => {
    const collection = db.collection("server_prefixes");

    const client = message.client;
    if (message.author.bot) return;
    if (message.channel.tpe === "dm") return;

    const guildPrefix = await collection.findOne({ [`${message.guildId}`]: { $exists: true } });
    let prefix = "!";
    if (guildPrefix) {
      prefix = guildPrefix[message.guildId];
    }
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd.length === 0) return;
    let command = client.prefixCommands.get(cmd);
    if (!command) command = client.prefixCommands.get(client.aliases.get(cmd));
    if (!command) return;
    if (!command.cooldown) {
      command.run(client, message, args, prefix, db);
      return;
    }
    if (cooldown.has(`${command.name}${message.author.id}`))
      return message
        .reply({
          content: `Try again in \`${ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true })}\``,
        })
        .then((msg) => setTimeout(() => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
    command.run(client, message, args, prefix, db);
    cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
    setTimeout(() => {
      cooldown.delete(`${command.name}${message.author.id}`);
    }, command.cooldown);

    module.exports = {
      client,
    };
  },
};
