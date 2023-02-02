const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const { Client } = require("ordr.js")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
exports.run = async (client, message, args, prefix) => {
    await message.channel.sendTyping()

    const ordrclient = new Client(process.env.ORDR_TOKEN)

    const getSkins = async (page) => {
        const data = await ordrclient.skins({ pageSize: 20, page: page });
        const presentationNames = data.skins.map(x => x.presentationName)
        const SkinID = data.skins.map(x => x.id)
        return { presentationNames, SkinID }
    }

    const getSkinsFull = async () => {
        const data = await ordrclient.skins({ pageSize: 460, page: 1 });
        const Ids_skin = data.skins.map(x => x.id)
        return { Ids_skin }
    }
    if (args.join(" ").includes('-set')) {
        fs.readFile("./user-data.json", async (error, data) => {
            if (error) {
                console.log(error);
                return
            }
            const userData = JSON.parse(data);


            const Values_skin = await getSkinsFull()

            const parts = args.join(" ").split(" ")
            const index = parts.indexOf('-set');
            // SkinId_ToSet = index === -1 ? 1 : parseInt(parts[index + 1])

            SkinId_ToSet = Number(args[1])

            if (Values_skin.Ids_skin.findIndex(x => x == SkinId_ToSet) === -1) {
                message.reply("**Please provide a valid skin ID.**")
                return;
            }

            userData[message.author.id] = { ...userData[message.author.id], ID_skin: `${SkinId_ToSet}` };
            fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                if (error) {
                    console.log(error);
                } else {
                    message.reply(`**Successfully assigned skin ID to: \`${SkinId_ToSet}\`**`);
                }
            });
        })
        return;
    }

    let page
    if (args.includes('-p')) {
        const parts = args.join(" ").split(" ")
        const index = parts.indexOf('-p');
        page = index === -1 ? 1 : parseInt(parts[index + 1])
    } else {
        page = 1
    }

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prev_page')
                .setLabel("Previous page")
                .setStyle(ButtonStyle.Secondary),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel("Next page")
                .setStyle(ButtonStyle.Primary),
        )

    const skinvalues = await getSkins(page)

    if (page > 23) {
        message.channel.send("**Page number must not be greater than 23**")
        return;
    }



    const SkinName = skinvalues.presentationNames
    const SkinID = skinvalues.SkinID
    const pageValue = '23'


    const embed = new EmbedBuilder()
        .setColor('Purple')
        .setTitle("Available skins:")
        .setFields(
            { name: "ID", value: `${SkinID.join("\n")}`, inline: true },
            { name: "Name", value: `${SkinName.join("\n")}`, inline: true },
        )
        .setFooter({ text: `Page: ${page}/${pageValue}` })

    await message.channel.send({ embeds: [embed], components: [buttons] })


    const collector = message.channel.createMessageComponentCollector({
        time: 1000 * 15
    });

    try {
        collector.on('collect', async i => {
            page = page

            if (i.customId == "prev_page") {
                if (page == 1) {
                    page == 1
                } else {
                    page--
                }
            }

            if (i.customId == "next_page") {
                if (page == 23) {
                    page == 23
                } else {
                    page++
                }
            }

            const newskinvalues = await getSkins(page)
            const newSkinName = newskinvalues.presentationNames
            const newSkinID = newskinvalues.SkinID

            const embedg = new EmbedBuilder()
                .setColor('Purple')
                .setTitle("Available skins:")
                .setFields(
                    { name: "ID", value: `${newSkinID.join("\n")}`, inline: true },
                    { name: "Name", value: `${newSkinName.join("\n")}`, inline: true },
                )
                .setFooter({ text: `Page: ${page}/23` })

            await i.update({ embeds: [embedg], components: [buttons] })
        })
    } catch (err) {

    }






};
exports.name = ["replayskin"]
exports.aliases = ["replayskin", "replayskins", "skinreplay"]
exports.description = ["Configure the skin of your replays.\n**Parameters:**\nLeave empty to see a list of skins\n\`-p (number)\` browse through the skin list\n\`-set (skin ID)\` set a skin as your default skin for a render by its ID"]
exports.usage = [`replayskin -set 16`]
exports.category = ["osu"]