async function run(message, client) {
  if (message.author.id !== "372343076578131968") {
    message.reply("You must be the bot's owner to use this command.");
    return;
  }
  message.reply("Terminated.");
  client.destroy();
}

module.exports = {
  name: "terminate",
  aliases: ["terminate"],
  cooldown: 5000,
  run: async ({ message, client }) => {
    await run(message, client);
  },
};
