async function run(message, args) {
  if (args.length === 0) {
    return message.channel.send("You must provide a query.");
  }
  let query = args.join("+");

  message.channel.send(`https://letmegooglethat.com/?q=${query}`);
}

module.exports = {
  name: "lmgt",
  aliases: ["lmgt"],
  cooldown: 5000,
  run: async ({ message, args }) => {
    await run(message, args);
  },
};
