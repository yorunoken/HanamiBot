const { v2, auth } = require('osu-api-extended')
const { ActionRowBuilder, Events, SelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { BeatmapCalculator } = require('@kionell/osu-pp-calculator')

exports.run = async (client, message, args, prefix) => {
    await message.channel.sendTyping()
    
    await auth.login_lazer(process.env.userd, process.env.pass);

    let value
    let QueryResults = 0
    const beatmapCalculator = new BeatmapCalculator();

    
    const query = args.join(" ")

    const SearchMap = await v2.beatmap.search({
        query: query,
        mode: 'osu',
        nsfw: true
    })



    const Map = SearchMap.beatmapsets[0]
    const Map2 = SearchMap.beatmapsets[1]
    const Map3 = SearchMap.beatmapsets[2]
    const Map4 = SearchMap.beatmapsets[3]
    const Map5 = SearchMap.beatmapsets[4]
    const Map6 = SearchMap.beatmapsets[5]
    const Map7 = SearchMap.beatmapsets[6]
    const Map8 = SearchMap.beatmapsets[7]
    const Map9 = SearchMap.beatmapsets[8]
    const Map10 = SearchMap.beatmapsets[9]

    if (Map == undefined) {
        message.reply("**No maps could be found with the Query, try again with another one.**")
        return
    }
    QueryResults++
    const DiffNumber1 = Map.beatmaps.length - 1
    Map.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
    const diff = Map.beatmaps[DiffNumber1]

    let length = diff.total_length.toFixed(0)
    let minutes = Math.floor(length / 60)
    let seconds = (length % 60).toString().padStart(2, "0");

    let Query2
    if (Map2 == undefined) {
        Query2 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf2',
        }
    } else {
        QueryResults++
        const DiffNumber = Map2.beatmaps.length - 1
        Map2.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff2 = Map2.beatmaps[DiffNumber]

        const length2 = diff2.total_length.toFixed(0)
        const minutes2 = Math.floor(length2 / 60)
        const seconds2 = (length2 % 60).toString().padStart(2, "0");


        Query2 = {
            label: `${Map2.title} [${Map2.beatmaps[Map2.beatmaps.length - 1].version}]`,
            description: `by ${Map2.creator} | ${diff2.difficulty_rating}★ | ${minutes2}:${seconds2} | BPM:${diff2.bpm} | AR${diff2.ar} | OD${diff2.accuracy} | CS${diff2.cs} | HP${diff2.drain} | ${diff2.status}`,
            value: 'map2',
        }
    }

    let Query3
    if (Map3 == undefined) {
        Query3 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf3',
        }
    } else {
        QueryResults++
        const DiffNumber = Map3.beatmaps.length - 1
        Map3.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff3 = Map3.beatmaps[DiffNumber]

        const length3 = diff3.total_length.toFixed(0)
        const minutes3 = Math.floor(length3 / 60)
        const seconds3 = (length3 % 60).toString().padStart(2, "0");


        Query3 = {
            label: `${Map3.title} [${Map3.beatmaps[Map3.beatmaps.length - 1].version}]`,
            description: `by ${Map3.creator} | ${diff3.difficulty_rating}★ | ${minutes3}:${seconds3} | BPM:${diff3.bpm} | AR${diff3.ar} | OD${diff3.accuracy} | CS${diff3.cs} | HP${diff3.drain} | ${diff3.status}`,
            value: 'map3',
        }
    }

    let Query4
    if (Map4 == undefined) {
        Query4 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf4',
        }
    } else {
        QueryResults++
        const DiffNumber = Map4.beatmaps.length - 1
        Map4.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff4 = Map4.beatmaps[DiffNumber]


        const length4 = diff4.total_length.toFixed(0)
        const minutes4 = Math.floor(length4 / 60)
        const seconds4 = (length4 % 60).toString().padStart(2, "0");


        Query4 = {
            label: ` ${Map4.title} [${Map4.beatmaps[Map4.beatmaps.length - 1].version}]`,
            description: `by ${Map4.creator} | ${diff4.difficulty_rating}★ | ${minutes4}:${seconds4} | BPM:${diff4.bpm} | AR${diff4.ar} | OD${diff4.accuracy} | CS${diff4.cs} | HP${diff4.drain} | ${diff4.status}`,
            value: 'map4',
        }
    }

    let Query5
    if (Map5 == undefined) {
        Query5 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf5',
        }
    } else {
        QueryResults++
        const DiffNumber = Map5.beatmaps.length - 1
        Map5.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff5 = Map5.beatmaps[DiffNumber]


        const length5 = diff5.total_length.toFixed(0)
        const minutes5 = Math.floor(length5 / 60)
        const seconds5 = (length5 % 60).toString().padStart(2, "0");


        Query5 = {
            label: `${Map5.title} [${Map5.beatmaps[Map5.beatmaps.length - 1].version}]`,
            description: `by ${Map5.creator} | ${diff5.difficulty_rating}★ | ${minutes5}:${seconds5} | BPM:${diff5.bpm} | AR${diff5.ar} | OD${diff5.accuracy} | CS${diff5.cs} | HP${diff5.drain} | ${diff5.status}`,
            value: 'map5',
        }
    }

    let Query6
    if (Map6 == undefined) {
        Query6 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf6',
        }
    } else {
        QueryResults++
        const DiffNumber = Map6.beatmaps.length - 1
        Map6.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff6 = Map6.beatmaps[DiffNumber]


        const length6 = diff6.total_length.toFixed(0)
        const minutes6 = Math.floor(length6 / 60)
        const seconds6 = (length6 % 60).toString().padStart(2, "0");


        Query6 = {
            label: `${Map6.title} [${Map6.beatmaps[Map6.beatmaps.length - 1].version}]`,
            description: `by ${Map6.creator} | ${diff6.difficulty_rating}★ | ${minutes6}:${seconds6} | BPM:${diff6.bpm} | AR${diff6.ar} | OD${diff6.accuracy} | CS${diff6.cs} | HP${diff6.drain} | ${diff6.status}`,
            value: 'map6',
        }
    }

    let Query7
    if (Map7 == undefined) {
        Query7 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf7',
        }
    } else {
        QueryResults++
        const DiffNumber = Map7.beatmaps.length - 1
        Map7.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff7 = Map7.beatmaps[DiffNumber]


        const length7 = diff7.total_length.toFixed(0)
        const minutes7 = Math.floor(length7 / 70)
        const seconds7 = (length7 % 70).toString().padStart(2, "0");


        Query7 = {
            label: `${Map7.title} [${Map7.beatmaps[Map7.beatmaps.length - 1].version}]`,
            description: `by ${Map7.creator} | ${diff7.difficulty_rating}★ | ${minutes7}:${seconds7} | BPM:${diff7.bpm} | AR${diff7.ar} | OD${diff7.accuracy} | CS${diff7.cs} | HP${diff7.drain} | ${diff7.status}`,
            value: 'map7',
        }
    }

    let Query8
    if (Map8 == undefined) {
        Query8 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf8',
        }
    } else {
        QueryResults++
        const DiffNumber = Map8.beatmaps.length - 1
        Map8.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff8 = Map8.beatmaps[DiffNumber]


        const length8 = diff8.total_length.toFixed(0)
        const minutes8 = Math.floor(length8 / 80)
        const seconds8 = (length8 % 80).toString().padStart(2, "0");


        Query8 = {
            label: `${Map8.title} [${Map8.beatmaps[Map8.beatmaps.length - 1].version}]`,
            description: `by ${Map8.creator} | ${diff8.difficulty_rating}★ | ${minutes8}:${seconds8} | BPM:${diff8.bpm} | AR${diff8.ar} | OD${diff8.accuracy} | CS${diff8.cs} | HP${diff8.drain} | ${diff8.status}`,
            value: 'map8',
        }
    }

    let Query9
    if (Map9 == undefined) {
        Query9 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf9',
        }
    } else {
        QueryResults++
        const DiffNumber = Map9.beatmaps.length - 1
        Map9.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff9 = Map9.beatmaps[DiffNumber]


        const length9 = diff9.total_length.toFixed(0)
        const minutes9 = Math.floor(length9 / 90)
        const seconds9 = (length9 % 90).toString().padStart(2, "0");


        Query9 = {
            label: `${Map9.title} [${Map9.beatmaps[Map9.beatmaps.length - 1].version}]`,
            description: `by ${Map9.creator} | ${diff9.difficulty_rating}★ | ${minutes9}:${seconds9} | BPM:${diff9.bpm} | AR${diff9.ar} | OD${diff9.accuracy} | CS${diff9.cs} | HP${diff9.drain} | ${diff9.status}`,
            value: 'map9',
        }
    }

    let Query10
    if (Map10 == undefined) {
        Query10 = {
            label: `-----------`,
            description: `----------`,
            value: 'mapf10',
        }
    } else {
        QueryResults++
        const DiffNumber = Map10.beatmaps.length - 1
        Map10.beatmaps.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
        const diff10 = Map10.beatmaps[DiffNumber]


        const length10 = diff10.total_length.toFixed(0)
        const minutes10 = Math.floor(length10 / 100)
        const seconds10 = (length10 % 100).toString().padStart(2, "0");


        Query10 = {
            label: `${Map10.title} [${Map10.beatmaps[Map10.beatmaps.length - 1].version}]`,
            description: `by ${Map10.creator} | ${diff10.difficulty_rating}★ | ${minutes10}:${seconds10} | BPM:${diff10.bpm} | AR${diff10.ar} | OD${diff10.accuracy} | CS${diff10.cs} | HP${diff10.drain} | ${diff10.status}`,
            value: 'map10',
        }
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId('select')
                .setPlaceholder(`Here are ${QueryResults} maps.`)
                .addOptions(
                    {
                        label: `${Map.title} [${Map.beatmaps[Map.beatmaps.length - 1].version}]`,
                        description: `by ${Map.creator} | ${diff.difficulty_rating}★ | ${minutes}:${seconds} | BPM:${diff.bpm} | AR${diff.ar} | OD${diff.accuracy} | CS${diff.cs} | HP${diff.drain} | ${diff.status}`,
                        value: 'map1',
                    },
                    Query2,
                    Query3,
                    Query4,
                    Query5,
                    Query6,
                    Query7,
                    Query8,
                    Query9,
                    Query10,
                ),
        );

    async function GetMap(value) {

        try {
            const Map = SearchMap.beatmapsets[value]
            const diff = Map.beatmaps[Map.beatmaps.length - 1]

            let length = diff.total_length.toFixed(0)
            let minutes = Math.floor(length / 60)
            let seconds = (length % 60).toString().padStart(2, "0");

            let map = await beatmapCalculator.calculate({
                beatmapId: diff.id,
                mods: "NM",
                accuracy: [95, 97, 99, 100]
            })

            let status = diff.status.charAt(0).toUpperCase() + diff.status.slice(1)

            const embed = new EmbedBuilder()
                .setColor('Purple')
                .setAuthor({ name: `Beatmap by ${map.beatmapInfo.creator}`, url: `https://osu.ppy.sh/u/${diff.user_id}`, iconURL: `https://a.ppy.sh/${diff.user_id}?1668890819.jpeg` })
                .setTitle(`${map.beatmapInfo.artist} - ${map.beatmapInfo.title}`)
                .setDescription(`Stars: \`${map.difficulty.starRating.toFixed(2)}★\` BPM: \`${map.beatmapInfo.bpmMode.toFixed()}\` Mods: \`${map.difficulty.mods}\`\n 🗺️ **[${map.beatmapInfo.version}]**\n - Combo: \`${map.difficulty.maxCombo.toLocaleString()}x\` Length: \`${minutes}:${seconds}\` Objects: \`${(map.beatmapInfo.hittable + map.beatmapInfo.slidable + map.beatmapInfo.spinnable).toLocaleString()}\`\n - AR: \`${map.difficulty.approachRate?.toFixed(1)}\` OD: \`${map.difficulty.overallDifficulty?.toFixed(1)}\` CS: \`${map.beatmapInfo.circleSize?.toFixed(2)}\` HP: \`${map.difficulty.drainRate?.toFixed(1)
                    }\`\n \`\`\`Acc:|  95%  |  97%  |  99%  |  100%\n-------------------------------------\nPP: |  ${map.performance[0].totalPerformance.toFixed(1)} | ${map.performance[1].totalPerformance.toFixed(1)} | ${map.performance[2].totalPerformance.toFixed(1)} | ${map.performance[3].totalPerformance.toFixed(1)}\`\`\``)
                .setURL(`https://osu.ppy.sh/b/${map.beatmapInfo.id}`)
                .setImage(`https://assets.ppy.sh/beatmaps/${map.beatmapInfo.beatmapsetId}/covers/cover.jpg`)
                .setFooter({ text: `${status} | ${Map.favourite_count} ♥` })

            return { embed }
        } catch (err) {
            console.log(err)
        }



    }



    const collector = message.channel.createMessageComponentCollector({
        time: 1000 * 30
    });

    collector.on("collect", async i => {
        if (i.values == "map1") value = 0

        if (i.values == "map2") value = 1

        if (i.values == "map3") value = 2

        if (i.values == "map4") value = 3

        if (i.values == "map5") value = 4

        if (i.values == "map6") value = 5

        if (i.values == "map7") value = 6

        if (i.values == "map8") value = 7

        if (i.values == "map9") value = 8

        if (i.values == "map10") value = 9


        console.log(value)
        const Map = await GetMap(value)
        console.log(Map.embed)
        await i.update({ embeds: [Map.embed], components: [row] })


    })



    message.channel.send({ content: 'hi', components: [row] })




}

exports.name = "search";
exports.aliases = ["search"]
exports.description = ["Search a beatmap by providing its name (No quotations needed.)"]
exports.usage = [`search Plasma gun`]
exports.category = ["osu"]