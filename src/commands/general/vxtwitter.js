exports.run = async (client, message, args, prefix) => {
    await message.channel.sendTyping()

    message.channel.messages.fetch({ limit: 100 }).then(async messages => {

        let TwitterLink
        for (const [id, m] of messages) {
            if (m.content.includes("https://twitter.com") && !m.author.bot) {
                TwitterLink = m;
                m.suppressEmbeds(true)
                break;
            }
        }
        try {
            console.log(TwitterLink.content)
            const ModifiedLink = TwitterLink.content.replace("https://twitter.com", "https://vxtwitter.com")
            message.channel.send(ModifiedLink)
        }
        catch (err) {
            console.log(err)
            message.reply("**No Twitter link was found!**")
        }
        // console.log(ModifiedLink)


    });
}

exports.name = "vxtwitter";
exports.aliases = ["vxtwitter", "vx"]
exports.description = ["replaces twitter.com with vxtwitter.com to make viewing videos on mobile much easier!"]
exports.usage = [`vx`]
exports.category = ["general"]