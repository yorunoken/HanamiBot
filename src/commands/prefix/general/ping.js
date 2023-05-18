async function run(message) {
  const timeNow = Date.now();
  const response = await message.channel.send(`Pong! 🏓`);
  const ms = Date.now() - timeNow;
  response.edit(`Pong! 🏓(${ms}ms)`);
}

module.exports = {
  name: "ping",
  aliases: ["pong"],
  cooldown: 5000,
  run: async (client, message, args, prefix) => {
    await run(message);
  },
};