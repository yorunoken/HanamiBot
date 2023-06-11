async function run(message, client) {
  if (message.author.id !== "372343076578131968") {
    return message.reply("You must be the owner to use this command.");
  }
  message.reply("Terminated.").then(() => client.destroy());
}

module.exports = {
  name: "terminate",
  aliases: ["terminate"],
  cooldown: 5000,
  run: async ({ message, client }) => {
    await run(message, client);
  },
};
