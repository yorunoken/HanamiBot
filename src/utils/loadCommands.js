const fs = require("fs");
async function load(client) {
  // slash command handler
  const prefixCommands = [];
  const prefixFolders = fs.readdirSync("./src/commands/prefix");
  for (const folder of prefixFolders) {
    const commandFiles = fs.readdirSync(`./src/commands/prefix/${folder}`);

    for (const file of commandFiles) {
      const command = require(`../commands/prefix/${folder}/${file}`);
      client.prefixCommands.set(command.name, command);
      prefixCommands.push(command.name, command);
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach((alias) => {
          client.aliases.set(alias, command.name);
        });
      }
    }
  }

  // slash command handler
  const slashCommands = [];
  const slashFolders = fs.readdirSync("./src/commands/slash");
  for (const folder of slashFolders) {
    const commandFiles = fs.readdirSync(`./src/commands/slash/${folder}`);

    for (const file of commandFiles) {
      const command = require(`../commands/slash/${folder}/${file}`);
      let jsonData;
      try {
        jsonData = JSON.parse(command.data);
      } catch (e) {}
      if (jsonData) {
        slashCommands.push(command.data.toJSON());
      } else {
        slashCommands.push(command.data);
      }
      client.slashCommands.set(command.data.name, command);
    }
  }
  return slashCommands;
}

module.exports = { load };
