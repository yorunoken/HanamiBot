exports.run = async (client, message, args, prefix, EmbedBuilder) => { 
  await message.channel.sendTyping()
  
  message.channel.send("Ship us!")
  };
  exports.name = "ship";
  exports.aliases = ["ship"]
  exports.description = ["come one leti!"]
  exports.usage = [`ship`]
  exports.category = ["general"]