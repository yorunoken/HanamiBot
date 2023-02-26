const {
    EmbedBuilder,
} = require("discord.js")
const fs = require('fs')
const { v2, auth, mods, tools } = require("osu-api-extended");
const { Beatmap, Calculator } = require('rosu-pp')
const { Downloader, DownloadEntry } = require("osu-downloader")

async function LbSend(beatmapId, scores, pagenum) {
    await auth.login(process.env.client_id, process.env.client_secret);

    const start = (pagenum - 1) * 5 + 1;
    const end = pagenum * 5;
    const numbers = [];
    for (let i = start; i <= end; i++) {
        numbers.push(i);
    }
    one = numbers[0] - 1;
    two = numbers[1] - 1;
    three = numbers[2] - 1;
    four = numbers[3] - 1;
    five = numbers[4] - 1;

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
        two = 1
        three = 2
        four = 3
        five = 4

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

        async function ScoreGet(score, num) {

            let ModsRaw = score.mods.map(mod => mod.acronym).join('')
            let modsID = mods.id(ModsRaw)
            if (ModsRaw != "") {
                Mods1 = `+${ModsRaw}`
            } else {
                Mods1 = ""
                modsID = 0
            }

            // std
            if (score.statistics.great === undefined) score.statistics.great = 0
            if (score.statistics.ok === undefined) score.statistics.ok = 0
            if (score.statistics.meh === undefined) score.statistics.meh = 0
            if (score.statistics.miss === undefined) score.statistics.miss = 0

            // mania
            if (score.statistics.good === undefined) score.statistics.good = 0 // katu
            if (score.statistics.perfect === undefined) score.statistics.perfect = 0 // geki


            let scoreParam = {
                mode: 0,
                mods: modsID,
            }

            let calc = new Calculator(scoreParam)

            // ss pp
            const maxAttrs = calc.performance(map)

            //normal pp
            let CurAttrs = calc
                .n100(score.statistics.ok)
                .n300(score.statistics.great)
                .n50(score.statistics.meh)
                .nMisses(Number(score.statistics.miss))
                .combo(score.max_combo)
                .nGeki(score.statistics.perfect)
                .nKatu(score.statistics.good)
                .performance(map)

            let grade = score.rank;
            grade = grades[grade];


            PP = `**${CurAttrs.pp.toFixed(2)}**/${maxAttrs.pp.toFixed(2)}PP`

            const date = new Date(score.ended_at)
            const UnixDate = date.getTime() / 1000

            const first_row = `**${num + 1}.** ${grade} [**${score.user.username}**](https://osu.ppy.sh/users/${score.user.id}) (${(score.accuracy * 100).toFixed(2)}%) • ${score.total_score.toLocaleString()} **${score.statistics.miss}**<:hit00:1061254490075955231>\n`
            const second_row = `▹${PP} • [ **${score.max_combo}x**/${maxAttrs.difficulty.maxCombo}x ] \`${Mods1}\` • [${CurAttrs.difficulty.stars.toFixed(2)}★]\n`
            const third_row = `▹Score Set: <t:${UnixDate}:R>`

            return `${first_row}${second_row}${third_row}`
        }

        first_score = "**No scores found.**"
        if (scores.scores[one]) first_score = `${await ScoreGet(scores.scores[one], pagenum)}\n`

        second_score = ""
        if (scores.scores[two]) second_score = `${await ScoreGet(scores.scores[two], pagenum)}\n`

        third_score = ""
        if (scores.scores[three]) third_score = `${await ScoreGet(scores.scores[three], pagenum)}\n`

        fourth_score = ""
        if (scores.scores[four]) fourth_score = `${await ScoreGet(scores.scores[four], pagenum)}\n`

        fifth_score = ""
        if (scores.scores[five]) fifth_score = `${await ScoreGet(scores.scores[five], pagenum)}`


        const embed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle(`${mapinfo.beatmapset.title} [${mapinfo.version}]`) // [${starRating.difficulty.starRating.toFixed(2)}★]
            .setURL(`https://osu.ppy.sh/b/${mapinfo.id}`)
            .setDescription(`${first_score}${second_score}${third_score}${fourth_score}${fifth_score}`)
            .setImage(`https://assets.ppy.sh/beatmaps/${mapinfo.beatmapset_id}/covers/cover.jpg`)
            .setFooter({ text: `Page: 1/${totalPage}` })

        return embed
    } catch (err) {
        console.log(err)
    }
}

module.exports = { LbSend }