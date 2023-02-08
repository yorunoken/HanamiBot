const { Octokit } = require('octokit');
const { EmbedBuilder } = require('discord.js')

exports.run = async (client, message, args, prefix, EmbedBuilder) => {
    await message.channel.sendTyping()

    if (message.author.id != "372343076578131968") {
        message.reply("**Only the developer can use this command.**")
        return;
    }

    const octokit = new Octokit({
        auth: process.env.Github_Token
    })

    let string = args.join(" ").match(/"(.*?)"/)
    if (string) {
        Title = string[1]
    } else {
        Title = args[0]
    }



    let labels = []

    if (args.includes("-bug")) labels.push("bug")
    if (args.includes("-documentation")) labels.push("documentation")
    if (args.includes("-duplicate")) labels.push("duplicate")
    if (args.includes("-priority")) labels.push("high priority")
    if (args.includes("-enhancement")) labels.push("enhancement")
    if (args.includes("-firstissue")) labels.push("good first issue")
    if (args.includes("-new")) labels.push("new command")
    if (args.includes("-suggestion")) labels.push("suggestion")
    if (args.includes("-wontfix")) labels.push("wontfix")




    
    
    if (message.reference.messageId) {
        message.channel.messages.fetch(message.reference.messageId).then(async Content => {
            
            const issuebuilder = await octokit.request('POST /repos/YoruNoKen/miaosu/issues', {
                owner: 'YoruNoKen',
                repo: 'miaosu',
                title: `${Title}`,
                body: `> ${Content.content}\n\n[Original Message by @${Content.author.tag}](https://canary.discord.com/channels/${Content.guildId}/${Content.channelId}/${Content.id})`,
                labels: labels
            })
            
            const labelNames = issuebuilder.data.labels.map(x => x.name).join(", ")
            const embed = new EmbedBuilder()
                .setTitle("Successful!")
                .setColor("Purple")
                .setDescription(`Successfully created Issue #${issuebuilder.data.number}\n[Click here to go to issue](https://github.com/YoruNoKen/miaosu/issues/${issuebuilder.data.number})`)
                .setFields(
                    { name: `Added Labels:`, value: labelNames },
                    { name: `Assigned:`, value: `YoruNoKen` }
                )

            message.channel.send({ embeds: [embed] })
        })
    }



}
exports.name = "issuebuilder"
exports.aliases = ["issuebuilder", "ib", "builder"]
exports.description = ["issue builder for github (developer only)"]
exports.usage = [`invite`]
exports.category = ["developer"]
