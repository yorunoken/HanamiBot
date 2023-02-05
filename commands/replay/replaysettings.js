const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
exports.run = async (client, message, args, prefix) => {


    if (!args[0]) {
        const embed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle("A list of settings for replay configuration:")
            .setDescription(`**parallax**: (true-false) \`Default => false\`\n**cursor_ripples**: (true/false) \`Default => false\`\n**cursor_size**: (0.5-2) \`Default => 1\`\n**bg_dim**: (1-100) \`Default => 75\`\n**storyboard**: (true/false) \`Default => true\`\n**bg_video**: (true/false) \`Default => true\`\n**key_overlay**: (true/false) \`Default => true\`\n**music_volume**: (1-100) \`Default => 50\`\n**hitsound_volume**: (1-100) \`Default => 50\`\n**danser_logo**: (true/false) \`Default => true\`\n**aim_ur**: (true/false) \`Default => false\`\n**ur**: (true/false) \`Default => true\`\n**pp_counter**: (true/false) \`Default => true\`\n**snaking_slider**: (true/false) \`Default => true\`\n\n**To configure a setting, do: \`${prefix}replaysettings -setting_name true/false/number\`**`)

        message.channel.send({ embeds: [embed] })
        return;
    }

    fs.readFile("./user-data.json", async (error, data) => {
        if (error) {
            console.log(error);
            return;
        }
        const userData = JSON.parse(data);





        // number variables
        if (args[0] == ("-bg_dim") || args[0] == ("bg_dim")) {
            if (isNaN(args[1])) {
                message.reply("**Please provide a number.**")
                return;
            }

            if (1 > args[1] || args[1] > 100) {
                message.reply("**Please pick a number between 1 and 100.**")
                return;
            }
            userData[message.author.id] = { ...userData[message.author.id], bg_dim: `${args[1]}` }
            fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                if (error) {
                    console.log(error);
                } else {
                    message.reply(`**Successfully set bg_dim to** \`${args[1]}\``)
                }
            });
        }

        if (args[0] == ("-music_volume") || args[0] == ("music_volume")) {
            if (isNaN(args[1])) {
                message.reply("**Please provide a number.**")
                return;
            }

            if (1 > args[1] || args[1] > 100) {
                message.reply("**Please pick a number between 1 and 100.**")
                return;
            }
            userData[message.author.id] = { ...userData[message.author.id], music_volume: `${args[1]}` }
            fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                if (error) {
                    console.log(error);
                } else {
                    message.reply(`**Successfully set music_volume to** \`${args[1]}\``)
                }
            });
        }

        if (args[0] == ("-hitsound_volume") || args[0] == ("hitsound_volume")) {
            if (isNaN(args[1])) {
                message.reply("**Please provide a number.**")
                return;
            }

            if (1 > args[1] || args[1] > 100) {
                message.reply("**Please pick a number between 1 and 100.**")
                return;
            }
            userData[message.author.id] = { ...userData[message.author.id], hitsound_volume: `${args[1]}` }
            fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                if (error) {
                    console.log(error);
                } else {
                    message.reply(`**Successfully set hitsound_volume to** \`${args[1]}\``)
                }
            });
        }



        // strict number variables
        if (args[0] == ("-cursor_size") || args[0] == ("cursor_size")) {
            if (isNaN(args[1])) {
                message.reply("**Please provide a number.**")
                return;
            }

            if (0.5 > args[1] || args[1] > 2) {
                message.reply("**Please pick a number between 0.5 and 2.**")
                return;

            }
            userData[message.author.id] = { ...userData[message.author.id], cursor_size: `${args[1]}` }
            fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                if (error) {
                    console.log(error);
                } else {
                    message.reply(`**Successfully set cursor_size to** \`${args[1]}\``)
                }
            });
        }




        // boolean variables
        if (args[0] == ("-parallax") || args[0] == ("parallax")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], parallax: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set parallax to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }

        if (args[0] == ("-cursor_ripples")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], cursor_ripples: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set cursor_ripples to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }

        if (args[0] == ("-storyboard") || args[0] == ("storyboard")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], storyboard: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set storyboard to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }

        if (args[0] == ("-bg_video") || args[0] == ("bg_video")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], bg_video: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set bg_video to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }

        if (args[0] == ("-key_overlay") || args[0] == ("key_overlay")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], key_overlay: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set key_overlay to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }

        if (args[0] == ("-danser_logo") || args[0] == ("danser_logo")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], danser_logo: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set danser_logo to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }


        if (args[0] == ("-aim_ur") || args[0] == ("aim_ur")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], aim_ur: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set aim_ur to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }

        if (args[0] == ("-ur") || args[0] == ("ur")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], ur: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set ur to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }

        if (args[0] == ("-pp_counter") || args[0] == ("pp_counter")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], pp_counter: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set pp_counter to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }

        if (args[0] == ("-snaking_slider") || args[0] == ("-snaking_slider")) {
            if (args[1] === "true" || args[1] === "false") {

                userData[message.author.id] = { ...userData[message.author.id], snaking_slider: `${args[1]}` }
                fs.writeFile("./user-data.json", JSON.stringify(userData), (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        message.reply(`**Successfully set snaking_slider to** \`${args[1]}\``)
                    }
                });

                return;
            }
            message.reply(`**Please provide a boolean**`)
        }


        if (args[0] == ("-self") || args[0] == ("self")) {

            const embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle(`${message.author.username}'s current skin settings:`)
            .setThumbnail(`${message.author.displayAvatarURL()}?size=1024`)
            .setDescription(`**parallax:** \`${userData[message.author.id].parallax}\`\n**cursor_ripples:** \`${userData[message.author.id].cursor_ripples}\`\n**cursor_size:** \`${userData[message.author.id].cursor_size}\`\n**bg_dim:** \`${userData[message.author.id].bg_dim}\`\n**storyboard:** \`${userData[message.author.id].storyboard}\`\n**bg_video:** \`${userData[message.author.id].bg_video}\`\n**key_overlay:** \`${userData[message.author.id].key_overlay}\`\n**music_volume:** \`${userData[message.author.id].music_volume}\`\n**hitsound_volume:** \`${userData[message.author.id].hitsound_volume}\`\n**danser_logo:** \`${userData[message.author.id].danser_logo}\`\n**aim_ur:** \`${userData[message.author.id].aim_ur}\``)

            message.channel.send({ embeds: [embed] })

            return;
        }






    })
};
exports.name = ["replaysettings"]
exports.aliases = ["replaysettings", "replaysetting", "settingsreplay", "settingreplay"]
exports.description = ["Configure the settings of your replays.\n**Parameters:**\nLeave empty to see a list of the settings\n\`-set (skin ID)\` set a skin as your default skin for a render by its ID\n\`-self\` to see your own settings"]
exports.usage = [`replaysettings -bg_dim 80\nreplaysettings -cursor_ripples true\nreplaysettings -cursor_size 1.3`]
exports.category = ["osu"]