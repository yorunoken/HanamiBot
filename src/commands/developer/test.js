
exports.run = async (client, message, args, prefix) => {
    await message.channel.sendTyping()

    if (message.author.id != "372343076578131968") {
        message.reply("**Only the developer can use this command.**")
        return
    }

    const command = args.join(' ');
    const usernameMatch = command.match(/"([^"]+)"|(\S+)/);
    const username = usernameMatch ? usernameMatch[1] || usernameMatch[2] : null;

    console.log(username)

}
exports.name = "ad"
exports.aliases = ["ad"]
exports.description = ["issue builder for github (developer only)"]
exports.usage = [`invite`]
exports.category = ["developer"]
