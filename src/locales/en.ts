import type { Locales } from "../Structure";

type strOrNum = string | number;

export default {
    code: "en-US",
    errorAtRuntime: "It seems you've encountered a bug. Fret not! An error message has already been sent to the owner of the bot. You can reach out to him on Discord at @yorunoken",
    embeds: {
        page: (page: string) => `Page ${page}`,
        otherPlays: "**__Other plays on the map:__**",
        provideUsername: "Please provide a username",
        prefix: {
            provideFlags: "Please provide either of these flags: `add, remove, list`.",
            prefixAlreadySet: (prefix: string) => `The prefix ${prefix} is already set!`,
            maxPrefix: (maxPrefix: string) => `The maximum number of prefixes you can add is ${maxPrefix}`,
            prefixAdded: (prefix: string) => `The prefix ${prefix} has been added to the array of prefixes!`,
            noPrefixes: "There are no prefixes set for this server yet.",
            serverDoesntHavePrefix: "This prefix isn't set in this server yet.",
            prefixRemoved: (prefix: string) => `The prefix ${prefix} has been removed from the array of prefixes!`,
            currentPrefixes: (prefixes: string) => `This server's current prefixes are: ${prefixes}`
        },
        help: {
            title: "Use `help <command>` for details of a command",
            commandNotFound: (name: string) => `The command with the name (or alias) ${name} was not found.`,
            commandInfoTitleEmbed: (name: string) => `Information of command: ${name}`,
            botInfo: "Bot Info",
            botServerCount: (length: string) => `Serving in ${length} servers`,
            botUptime: (uptime: string) => `Started ${uptime}`, // uptime will display "X seconds/minuts/hours ago"
            commands: "Command Usage"
        },
        leaderboard: {
            noScores: "This map has no scores in its leaderboard.",
            global: "global",
            country: "Turkish",
            type: (type: string) => `Showing ${type} leaderboard.`,
            playScore: (userId: strOrNum) => `<@${userId}>'s score:`
        },
        map: {
            beatmapBy: (username: string) => `Beatmap by ${username}`,
            stars: "Stars",
            mods: "Mods",
            length: "Length",
            maxCombo: "Max Combo",
            objects: "Objects",
            links: "Links",
            ranked: "ranked",
            loved: "loved",
            qualified: "qualified",
            pending: "pending",
            graveyard: "graveyard"
        },
        link: {
            success: (id: strOrNum, username: string) => `Successfully linked your Discord account (<@${id}>) to osu! user ${username}`
        },
        plays: {
            top: "top",
            recent: "recent",
            noScores: (username: string, type: string) => `The user \`${username}\` does not have any ${type} plays in Bancho.`,
            playsFound: (length: number) => `Found \`${length}\` plays`,
            try: "Try",
            length: "Length",
            mapper: (username: string) => `by ${username}`
        },
        whatif: {
            count: "a",
            plural: "s",
            title: (username: string, length: strOrNum, pp: strOrNum, plural: string) => `${username} gets ${length} new ${pp}pp play${plural}`,
            samePp: (pp: strOrNum, username: string) => `A ${pp}pp play would not be in ${username}'s top 100 plays, so their rank and pp remains unchanged.`,
            description: (
                length: strOrNum,
                pp: strOrNum,
                username: string,
                plural: string,
                position: strOrNum,
                newPp: strOrNum,
                diffPp: strOrNum,
                rank: strOrNum,
                rankDiff: strOrNum
            ) => `${length} new ${pp}pp play${plural} would be ${username}'s #${position} top play.
            It would increase their total pp to ${newPp}, by ${diffPp} and increase their rank to #${rank} (+${rankDiff}).`
        },
        pp: {
            ppHigh: (username: string) => `${username} is already above that pp value.`,
            playerMissing: (username: string, pp: strOrNum) => `What play is ${username} missing to reach ${pp}pp?`,
            description: (
                username: string,
                target: strOrNum,
                pp: strOrNum,
                position: strOrNum,
                rank: strOrNum
            ) => `To reach **${target}pp**, ${username} needs to set one **${pp}pp** score which would be their top #${position}, and push their to rank **#${rank}**`
        },
        rank: {
            rankHigh: (username: string) => `${username} is already above that rank.`,
            playerMissing: (username: string, rank: strOrNum) => `What play is ${username} missing to reach #${rank}?`,
            description: (
                username: string,
                target: strOrNum,
                pp: strOrNum,
                position: strOrNum,
                newPp: strOrNum
            ) => `To reach **#${target}**, ${username} needs to set one **${pp}pp** score which would be their top #${position}, and increase their total pp to **${newPp}**`
        },
        profile: {
            peakRank: "Peak Rank",
            achieved: "Achieved",
            statistics: "Statistics",
            accuracy: "Accuracy",
            level: "Level",
            playcount: "Playcount",
            followers: "Followers",
            maxCombo: "Max Combo",
            recommendedStars: "Recommended Star Rating",
            grades: "Grades",
            joinDate: (date: string, ago: strOrNum) => `Joined osu! ${date} (${ago} years ago)`,
            score: "Score",
            rankedScore: "Ranked Score",
            totalScore: "Total Score",
            objectsHit: "Objects Hit",
            profile: "Profile"
        },
        nochoke: {
            alreadyDownloading: (username: string) => `The bot is already in the process of downloading ${username}'s plays. Please be patient.`,
            mapsArentInDb: (username: string, missingMaps: strOrNum) => `\`${missingMaps}\` of ${username}'s plays are not in the bot's database. Please wait while the bot is downloading your maps.`,
            mapsDownloaded: "Maps have been downloaded, setting up embed.",
            approximateRank: (pp: strOrNum, rank: strOrNum) => `Approx. rank for ${pp}pp: #${rank}`
        }
    },
    classes: {
        occupation: "Occupation",
        interests: "Interests",
        location: "Location",
        globalRank: "Global Rank",
        ifFc: (accuracy: string, pp: strOrNum) => `If FC: ${pp}pp for ${accuracy}`,
        songPreview: "Song Preview",
        mapPreview: "Map Preview",
        fullBackground: "Full Background",
        ranked: "Ranked At",
        loved: "Loved At",
        qualified: "Qualified At",
        updatedAt: "Last Updated At"
    },
    fails: {
        languageDoesntExist: "That language doesn't exist in /locales. Consider [opening a pull request on github](https://github.com/YoruNoKen/HanamiBot) :)",
        channelDoesntExist: "This channel doesn't exist.",
        linkFail: "Something went wrong, try wrapping the username in quotes (`)",
        userDoesntExist: (user: string) => `The user ${user} does not exist in Bancho.`,
        userHasNoScores: (user: string) => `${user} has no scores on this beatmap.`,
        provideValidPage: (maxValue: strOrNum) => `Please provide a valid page (between 1 and ${maxValue})`,
        noLeaderboard: "Either this map doesn't exist, or it doesn't have a leaderboard.",
        noBeatmapIdInCtx: "Either this beatmap doesn't exist, has no leaderboard, or a wrong ID was given.",
        error: "Something went wrong.",
        interactionError: "There was an error with this interaction. Please try again.",
        cooldownTime: (cooldown: string) => `Try again in ${cooldown}`,
        userButtonNotAllowed: "You need to be the one who initialized the command to be able to click the buttons."
    },
    modals: {
        enterValue: "Enter a value",
        valueInsert: (maxValue: strOrNum) => `Your value here. (1-${maxValue})`
    },
    misc: {
        success: "Success!",
        warning: "Warning!",
        poweredBy: "Powered by YoruNoKen's osu! supporter",
        languageSet: (language: string) => `Successfully set language to: \`${language}\``,
        feedbackSent: "Feedback sent, thank you!"
    }
} as Locales;
