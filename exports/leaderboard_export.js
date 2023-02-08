const {
    EmbedBuilder,
} = require("discord.js")
const fs = require('fs')
const { v2, auth, mods, tools } = require("osu-api-extended");
const { Beatmap, Calculator } = require('rosu-pp')
const { Downloader, DownloadEntry } = require("osu-downloader")

async function LbSend(beatmapId, scores) {
    await auth.login(process.env.client_id, process.env.client_secret);
    try {

        if (!fs.existsSync(`./osuFiles/${beatmapId}.osu`)) {
            console.log("no file.")
            const downloader = new Downloader({
                rootPath: './osuFiles',

                filesPerSecond: 0,
            });

            downloader.addSingleEntry(beatmapId)
            await downloader.downloadSingle()
        }

        let map = new Beatmap({ path: `./osuFiles/${beatmapId}.osu` })

        const mapinfo = await v2.beatmap.diff(beatmapId)

        one = 0
        two = 2
        three = 3
        four = 4
        five = 5

        const grades = {
            A: "<:A_:1057763284327080036>",
            B: "<:B_:1057763286097076405>",
            C: "<:C_:1057763287565086790>",
            D: "<:D_:1057763289121173554>",
            F: "<:F_:1057763290484318360>",
            S: "<:S_:1057763291998474283>",
            SH: "<:SH_:1057763293491642568>",
            X: "<:X_:1057763294707974215>",
            XH: "<:XH_:1057763296717045891>",
        };

        const totalPageRaw = scores.scores.length / 5
        const totalPage = Math.ceil(totalPageRaw)

        if (scores.scores[one]) {

            let ModsRaw = scores.scores[one].mods.map(mod => mod.acronym).join('')
            let modsID = mods.id(ModsRaw)
            if (ModsRaw != "") {
                Mods1 = `+**${ModsRaw}**`
            } else {
                Mods1 = ""
                modsID = 0
            }

            // std
            if (scores.scores[one].statistics.great === undefined) scores.scores[one].statistics.great = 0
            if (scores.scores[one].statistics.ok === undefined) scores.scores[one].statistics.ok = 0
            if (scores.scores[one].statistics.meh === undefined) scores.scores[one].statistics.meh = 0
            if (scores.scores[one].statistics.miss === undefined) scores.scores[one].statistics.miss = 0

            // mania
            if (scores.scores[one].statistics.good === undefined) scores.scores[one].statistics.good = 0 // katu
            if (scores.scores[one].statistics.perfect === undefined) scores.scores[one].statistics.perfect = 0 // geki


            let scoreParam = {
                mode: 0,
                mods: modsID,
            }

            let calc = new Calculator(scoreParam)

            // ss pp
            const maxAttrs = calc.performance(map)

            //normal pp
            let CurAttrs = calc
                .n100(scores.scores[one].statistics.ok)
                .n300(scores.scores[one].statistics.great)
                .n50(scores.scores[one].statistics.meh)
                .nMisses(Number(scores.scores[one].statistics.miss))
                .combo(scores.scores[one].max_combo)
                .nGeki(scores.scores[one].statistics.perfect)
                .nKatu(scores.scores[one].statistics.good)
                .performance(map)

            let grade = scores.scores[one].rank;
            grade = grades[grade];


            PP = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

            const date = new Date(scores.scores[one].ended_at)
            const UnixDate = date.getTime() / 1000



            first_score = `**${one + 1}.** ${grade} [**${scores.scores[one].user.username}**](https://osu.ppy.sh/users/${scores.scores[one].user.id}) (${(scores.scores[one].accuracy * 100).toFixed(2)}%) • ${scores.scores[one].total_score.toLocaleString()} **${scores.scores[one].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP} • [ **${scores.scores[one].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods1} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>\n`
        } else {
            first_score = "**No scores found.**"
        }

        if (scores.scores[two]) {

            let ModsRaw = scores.scores[two].mods.map(mod => mod.acronym).join('')
            let modsID = mods.id(ModsRaw)
            if (ModsRaw != "") {
                Mods2 = `+**${ModsRaw}**`
            } else {
                Mods2 = ""
                modsID = 0
            }

            // std
            if (scores.scores[two].statistics.great === undefined) scores.scores[two].statistics.great = 0
            if (scores.scores[two].statistics.ok === undefined) scores.scores[two].statistics.ok = 0
            if (scores.scores[two].statistics.meh === undefined) scores.scores[two].statistics.meh = 0
            if (scores.scores[two].statistics.miss === undefined) scores.scores[two].statistics.miss = 0

            // mania
            if (scores.scores[two].statistics.good === undefined) scores.scores[two].statistics.good = 0 // katu
            if (scores.scores[two].statistics.perfect === undefined) scores.scores[two].statistics.perfect = 0 // geki


            let scoreParam = {
                mode: 0,
                mods: modsID,
            }

            let calc = new Calculator(scoreParam)

            // ss pp
            const maxAttrs = calc.performance(map)

            //normal pp
            let CurAttrs = calc
                .n100(scores.scores[two].statistics.ok)
                .n300(scores.scores[two].statistics.great)
                .n50(scores.scores[two].statistics.meh)
                .nMisses(Number(scores.scores[two].statistics.miss))
                .combo(scores.scores[two].max_combo)
                .nGeki(scores.scores[two].statistics.perfect)
                .nKatu(scores.scores[two].statistics.good)
                .performance(map)

            let grade2 = scores.scores[two].rank;
            grade2 = grades[grade2];


            PP2 = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

            const date = new Date(scores.scores[two].ended_at)
            const UnixDate = date.getTime() / 1000

            second_score = `**${two + 1}.** ${grade2} [**${scores.scores[two].user.username}**](https://osu.ppy.sh/users/${scores.scores[two].user.id}) (${(scores.scores[two].accuracy * 100).toFixed(2)}%) • ${scores.scores[two].total_score.toLocaleString()} **${scores.scores[two].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP2} • [ **${scores.scores[two].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods2} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>\n`

        } else {
            second_score = ""
        }

        if (scores.scores[three]) {

            let ModsRaw = scores.scores[three].mods.map(mod => mod.acronym).join('')
            let modsID = mods.id(ModsRaw)
            if (ModsRaw != "") {
                Mods3 = `+**${ModsRaw}**`
            } else {
                Mods3 = ""
                modsID = 0
            }

            // std
            if (scores.scores[three].statistics.great === undefined) scores.scores[three].statistics.great = 0
            if (scores.scores[three].statistics.ok === undefined) scores.scores[three].statistics.ok = 0
            if (scores.scores[three].statistics.meh === undefined) scores.scores[three].statistics.meh = 0
            if (scores.scores[three].statistics.miss === undefined) scores.scores[three].statistics.miss = 0

            // mania
            if (scores.scores[three].statistics.good === undefined) scores.scores[three].statistics.good = 0 // katu
            if (scores.scores[three].statistics.perfect === undefined) scores.scores[three].statistics.perfect = 0 // geki


            let scoreParam = {
                mode: 0,
                mods: modsID,
            }

            let calc = new Calculator(scoreParam)

            // ss pp
            const maxAttrs = calc.performance(map)

            //normal pp
            let CurAttrs = calc
                .n100(scores.scores[three].statistics.ok)
                .n300(scores.scores[three].statistics.great)
                .n50(scores.scores[three].statistics.meh)
                .nMisses(Number(scores.scores[three].statistics.miss))
                .combo(scores.scores[three].max_combo)
                .nGeki(scores.scores[three].statistics.perfect)
                .nKatu(scores.scores[three].statistics.good)
                .performance(map)

            let grade3 = scores.scores[three].rank;
            grade3 = grades[grade3];


            PP3 = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

            const date = new Date(scores.scores[three].ended_at)
            const UnixDate = date.getTime() / 1000

            third_score = `**${three + 1}.** ${grade3} [**${scores.scores[three].user.username}**](https://osu.ppy.sh/users/${scores.scores[three].user.id}) (${(scores.scores[three].accuracy * 100).toFixed(2)}%) • ${scores.scores[three].total_score.toLocaleString()} **${scores.scores[three].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP3} • [ **${scores.scores[three].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods3} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>\n`

        } else {
            third_score = ""
        }

        if (scores.scores[four]) {

            let ModsRaw = scores.scores[four].mods.map(mod => mod.acronym).join('')
            let modsID = mods.id(ModsRaw)
            if (ModsRaw != "") {
                Mods4 = `+**${ModsRaw}**`
            } else {
                Mods4 = ""
                modsID = 0
            }

            // std
            if (scores.scores[four].statistics.great === undefined) scores.scores[four].statistics.great = 0
            if (scores.scores[four].statistics.ok === undefined) scores.scores[four].statistics.ok = 0
            if (scores.scores[four].statistics.meh === undefined) scores.scores[four].statistics.meh = 0
            if (scores.scores[four].statistics.miss === undefined) scores.scores[four].statistics.miss = 0

            // mania
            if (scores.scores[four].statistics.good === undefined) scores.scores[four].statistics.good = 0 // katu
            if (scores.scores[four].statistics.perfect === undefined) scores.scores[four].statistics.perfect = 0 // geki


            let scoreParam = {
                mode: 0,
                mods: modsID,
            }

            let calc = new Calculator(scoreParam)

            // ss pp
            const maxAttrs = calc.performance(map)

            //normal pp
            let CurAttrs = calc
                .n100(scores.scores[four].statistics.ok)
                .n300(scores.scores[four].statistics.great)
                .n50(scores.scores[four].statistics.meh)
                .nMisses(Number(scores.scores[four].statistics.miss))
                .combo(scores.scores[four].max_combo)
                .nGeki(scores.scores[four].statistics.perfect)
                .nKatu(scores.scores[four].statistics.good)
                .performance(map)

            let grade4 = scores.scores[four].rank;
            grade4 = grades[grade4];


            PP4 = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

            const date = new Date(scores.scores[four].ended_at)
            const UnixDate = date.getTime() / 1000

            fourth_score = `**${four + 1}.** ${grade4} [**${scores.scores[four].user.username}**](https://osu.ppy.sh/users/${scores.scores[four].user.id}) (${(scores.scores[four].accuracy * 100).toFixed(2)}%) • ${scores.scores[four].total_score.toLocaleString()} **${scores.scores[four].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP4} • [ **${scores.scores[four].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods4} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>\n`

        } else {
            fourth_score = ""
        }

        if (scores.scores[five]) {

            let ModsRaw = scores.scores[five].mods.map(mod => mod.acronym).join('')
            let modsID = mods.id(ModsRaw)
            if (ModsRaw != "") {
                Mods5 = `+**${ModsRaw}**`
            } else {
                Mods5 = ""
                modsID = 0
            }

            // std
            if (scores.scores[five].statistics.great === undefined) scores.scores[five].statistics.great = 0
            if (scores.scores[five].statistics.ok === undefined) scores.scores[five].statistics.ok = 0
            if (scores.scores[five].statistics.meh === undefined) scores.scores[five].statistics.meh = 0
            if (scores.scores[five].statistics.miss === undefined) scores.scores[five].statistics.miss = 0

            // mania
            if (scores.scores[five].statistics.good === undefined) scores.scores[five].statistics.good = 0 // katu
            if (scores.scores[five].statistics.perfect === undefined) scores.scores[five].statistics.perfect = 0 // geki


            let scoreParam = {
                mode: 0,
                mods: modsID,
            }

            let calc = new Calculator(scoreParam)

            // ss pp
            const maxAttrs = calc.performance(map)

            //normal pp
            let CurAttrs = calc
                .n100(scores.scores[five].statistics.ok)
                .n300(scores.scores[five].statistics.great)
                .n50(scores.scores[five].statistics.meh)
                .nMisses(Number(scores.scores[five].statistics.miss))
                .combo(scores.scores[five].max_combo)
                .nGeki(scores.scores[five].statistics.perfect)
                .nKatu(scores.scores[five].statistics.good)
                .performance(map)

            let grade5 = scores.scores[five].rank;
            grade5 = grades[grade5];


            PP5 = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

            const date = new Date(scores.scores[five].ended_at)
            const UnixDate = date.getTime() / 1000

            fifth_score = `**${five + 1}.** ${grade5} [**${scores.scores[five].user.username}**](https://osu.ppy.sh/users/${scores.scores[five].user.id}) (${(scores.scores[five].accuracy * 100).toFixed(2)}%) • ${scores.scores[five].total_score.toLocaleString()} **${scores.scores[five].statistics.miss}**<:hit00:1061254490075955231>\n▹${PP5} • [ **${scores.scores[five].max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] ${Mods5} • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n▹**Score Set:** <t:${UnixDate}:R>`

        } else {
            fifth_score = ""
        }

        const embed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle(`${mapinfo.beatmapset.title} [${mapinfo.version}]`) // [${starRating.difficulty.starRating.toFixed(2)}★]
            .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
            .setDescription(`${first_score}${second_score}${third_score}${fourth_score}${fifth_score}`)
            .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
            .setFooter({ text: `Page: 1/${totalPage}` })

        return { embed }
    } catch (err) {
        console.log(err)
    }
}

module.exports = { LbSend }