async function run(message, client) {
  if (message.author.id !== "372343076578131968") {
    return message.reply("You must be the owner to use this command.");
  }
  message.reply("Terminated instance.").then(() => client.destroy());
}

module.exports = {
  name: "avatar",
  aliases: ["avatar"],
  cooldown: 5000,
  run: async ({ message, client }) => {
    await run(message, client);
  },
};
