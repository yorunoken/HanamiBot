const { Collection, Message } = require("discord.js");
const ms = require("ms");
const cooldown = new Collection();
// const { login } = require("../utils/handleLogin.js");
const { query } = require("../utils/getQuery.js");

module.exports = {
  name: "messageCreate",
  /**
   *
   * @param {Message} message
   * @returns
   */
  execute: async (message, db) => {
    // if (message.channel.id === "1111679796058017917") {
    //   await login(message);
    //   return;
    // }

    const client = message.client;
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.content === ":3") return message.channel.send("3:");
    if (message.content === "3:") return message.channel.send(":3");

    const document = await query({ query: `SELECT * FROM servers WHERE id = ?`, parameters: [message.guildId], type: "get", name: "value" });
    let prefixOptions = ["!"];
    if (document && document.length > 0) {
      prefixOptions = document;
    }
    let prefix = prefixOptions.find((p) => message.content.startsWith(p));
    if (!prefix) return;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd.length === 0) return;

    let commandName = cmd;
    let number;
    const match = cmd.match(/(\D+)(\d+)/);
    if (match) {
      commandName = match[1];
      number = match[2];
    }

    let command = client.prefixCommands.get(commandName);
    if (!command) command = client.prefixCommands.get(client.aliases.get(commandName));
    if (!command) return;
    if (!command.cooldown) {
      command.run({ client, message, args, prefix, index: number, commandName, db });
      return;
    }
    if (cooldown.has(`${command.name}${message.author.id}`))
      return message
        .reply({
          content: `Try again in \`${ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true })}\``,
        })
        .then((msg) => setTimeout(() => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()));
    command.run({ client, message, args, prefix, index: number, commandName, db });
    cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
    setTimeout(() => {
      cooldown.delete(`${command.name}${message.author.id}`);
    }, command.cooldown);

    module.exports = {
      client,
    };
  },
};
