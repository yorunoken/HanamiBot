import { db } from "./Events/ready";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType } from "discord.js";
import { mods } from "osu-api-extended";
//@ts-expect-error idk lmao the owner just didn't want to include types ig
import { DownloadEntry, Downloader } from "osu-downloader";
import { Beatmap, Calculator } from "rosu-pp";
import type { response as UserResponse } from "osu-api-extended/dist/types/v2_user_details";
import type { ChatInputCommandInteraction, Client, Message, TextBasedChannel, User as UserDiscord } from "discord.js";
import type { DbCommands, DbMaps, DbServer, DbUser, EmbedOptions, NoChokePlayDetails, osuModes } from "./Structure";

export const grades: Record<string, string> = {
    A: "<:A_:1057763284327080036>",
    B: "<:B_:1057763286097076405>",
    C: "<:C_:1057763287565086790>",
    D: "<:D_:1057763289121173554>",
    F: "<:F_:1057763290484318360>",
    S: "<:S_:1057763291998474283>",
    SH: "<:SH_:1057763293491642568>",
    X: "<:X_:1057763294707974215>",
    XH: "<:XH_:1057763296717045891>"
};

export const osuEmojis: Record<string, string> = {
    osu: "<:osu:1075928459014066286>",
    mania: "<:mania:1075928451602718771>",
    taiko: "<:taiko:1075928454651969606>",
    fruits: "<:ctb:1075928456367444018>"
};

export const rulesets: Record<string, number> = {
    osu: 0,
    taiko: 1,
    fruits: 2,
    mania: 3
};

export function buildActionRow(buttons: Array<ButtonBuilder>, disabledStates: Array<boolean> = []): ActionRowBuilder {
    const actionRow = new ActionRowBuilder();
    buttons.forEach((button, index) => {
        const isButtonDisabled = disabledStates[index];
        actionRow.addComponents(isButtonDisabled ? button.setDisabled(true) : button.setDisabled(false));
    });
    return actionRow;
}

export function getRetryCount(retryMap: Array<number>, mapId: number): number {
    let retryCounter = 0;
    for (let i = 0; i < retryMap.length; i++) {
        if (retryMap[i] === mapId)
            retryCounter++;
    }
    return retryCounter;
}

export function returnFlags({ page, index, mods: modded }: { page?: boolean, index?: boolean, mods?: boolean }): string {
    return `${page ? "- page(p)=number (returns the page corresponding to 'number')" : ""}
${index ? "- index(i)=number (returns the index corresponding to 'number')" : ""}
${modded ? "- +MODS (returns play(s) with provided mod combination)" : ""}`;
}
export function formatNumber(value: number, decimalPlaces: number): string {
    return value.toFixed(decimalPlaces).replace(/\.0+$/, "");
}
export function errMsg(message: string): { status: false, message: string } {
    return { status: false, message };
}
export function getUserData(userId: string): DbUser | { status: false, message: string } {
    return getUser(userId) ?? errMsg(`The Discord user <@${userId}> hasn't linked their account to the bot yet!`);
}
export function buttonBoolsTops(type: string, options: EmbedOptions): boolean | undefined {
    if (options.page === undefined) return;
    return type === "previous" ? options.page * 5 === 0 : options.page * 5 + 5 === (options.plays.length || options.length);
}

export function buttonBoolsIndex(type: string, options: EmbedOptions): boolean | undefined {
    if (options.index === undefined) return;
    return type === "previous" ? options.index === 0 : options.index + 1 === options.plays.length;
}

const flags = ["i", "index", "rev", "p", "page"];
export function argParser(str: string, flagsArr: Array<string>): Record<string, string | boolean> {
    const matches = [...str.matchAll(/-(\w+)|(\w+)=(\S+)/g)];

    const filteredMatches = matches.filter((m) => flagsArr.includes(m[1]) || flagsArr.includes(m[2]));

    return filteredMatches.reduce<Record<string, string | boolean>>((acc, m) => {
        acc[m[1] || m[2]] = m[3] !== undefined ? m[3] : true;
        return acc;
    }, {});
}

function modsParser(str: string): undefined | Record<string, string | RegExpMatchArray | null | boolean> {
    const modCodes = (str.match(/[-+!][-+!]?[A-Za-z]+/g) ?? []).map((code) => code.toUpperCase());

    const force = modCodes.some((code) => code.includes("!"));
    return modCodes.some((code) => code.includes("-")) && !force
        ? undefined
        : {
            force,
            include: !!modCodes.some((code) => code.includes("+")),
            remove: !!(modCodes.some((code) => code.includes("-")) && force),
            codes: modCodes
                .map((code) => code.replace(/[+\-!]/g, ""))
                .join("")
                .match(/.{1,2}/g),
            whole: modCodes.join("")
        };
}

export const loadingButtons = buildActionRow([new ButtonBuilder().setCustomId("wating").setLabel("Waiting..").setStyle(ButtonStyle.Secondary)], [true]);
export const showMoreButton = buildActionRow([new ButtonBuilder().setCustomId("more").setLabel("Show More").setStyle(ButtonStyle.Success)]);
export const showLessButton = buildActionRow([new ButtonBuilder().setCustomId("less").setLabel("Show Less").setStyle(ButtonStyle.Success)]);

export const firstButton = new ButtonBuilder().setCustomId("first").setEmoji("1177027029154156615").setStyle(ButtonStyle.Secondary);
export const lastButton = new ButtonBuilder().setCustomId("last").setEmoji("1177027026947948584").setStyle(ButtonStyle.Secondary);
export const previousButton = new ButtonBuilder().setCustomId("previous").setEmoji("1177027021646331995").setStyle(ButtonStyle.Secondary);
export const nextButton = new ButtonBuilder().setCustomId("next").setEmoji("1177027023030456420").setStyle(ButtonStyle.Secondary);
export const specifyButton = new ButtonBuilder().setCustomId("indexbtn").setEmoji("1177027025672871936").setStyle(ButtonStyle.Secondary);

export function getWholeDb(dbName: string): unknown {
    return db.prepare(`SELECT * FROM ${dbName}`).all();
}

export function getCommand(id: string | number): DbCommands | undefined {
    return db.prepare("SELECT * FROM commands WHERE name = ?").get(id) as DbCommands;
}

export function getUser(id: string | number): DbUser | undefined {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser;
}

export function getServer(id: string | number): DbServer | undefined {
    return db.prepare("SELECT * FROM servers WHERE id = ?").get(id) as DbServer;
}

export function getServersInBulk(ids: Array<string> | Array<number>): Array<DbServer> | undefined {
    const placeholders = ids.map(() => "?").join(", ");
    const query = `SELECT * FROM servers WHERE id IN (${placeholders})`;
    return db.prepare(query).all(...ids) as Array<DbServer>;
}

export function getMap(id: string | number): DbMaps | undefined {
    return db.prepare("SELECT * FROM maps WHERE id = ?").get(id) as DbMaps;
}

export function getMapsInBulk(ids: Array<string> | Array<number>): Array<DbMaps> | undefined {
    const placeholders = ids.map(() => "?").join(", ");
    const query = `SELECT * FROM maps WHERE id IN (${placeholders})`;
    return db.prepare(query).all(...ids) as Array<DbMaps>;
}

export function insertData({ table, id, data }: { table: string, id: string | number, data: Array<{ name: string, value: string | number }> }): void {
    const fields: Array<string> = data.map((item) => item.name);
    const values: Array<string | number | null> = data.map((item) => item.value);
    console.log(fields, values);

    db.prepare(`INSERT OR REPLACE INTO ${table} (id, ${fields.join(", ")}) values (?, ${fields.map(() => "?").join(", ")})`)
        .run(id, ...values);
}

export function insertDataBulk({ table, object }: { table: string, object: Array<{ id: number, data: string }> }): void {
    const insertStatement = db.prepare(`INSERT OR REPLACE INTO ${table} values (?, ?)`);

    const transaction = db.transaction(() => {
        for (const { id, data } of object) insertStatement.run(id, data);
    });

    transaction();
}

function calculateRemaining(idx: number, goal: number, top: number, bot: number): [number, number] {
    const factor = Math.pow(0.95, idx);
    const required = (goal - top - bot) / factor;

    return [required, idx];
}

export function calculateMissingPp(start: number, goal: number, pps: Array<number>): [number, number] {
    let top = start;
    let bot = 0.0;
    const ppArray = pps;

    for (let i = ppArray.length - 1; i > 0; i--) {
        const factor = Math.pow(0.95, i);
        const term = factor * ppArray[i];
        const botTerm = term * 0.95;

        if (top + bot + botTerm >= goal)
            return calculateRemaining(i + 1, goal, top, bot);

        bot += botTerm;
        top -= term;
    }

    return calculateRemaining(0, goal, top, bot);
}

export function approxMorePp(pps: Array<number>): void {
    if (pps.length !== 100)
        return;

    const diff = (pps[89] - pps[99]) / 10.0;

    let curr = pps[99];

    for (let i = 0; i < 50; i++) {
        const next = curr - diff;

        if (next < 0) break;

        pps.push(next);
        curr = next;
    }
}

export function calculateWeightedScores({ user, plays }: { user: UserResponse, plays: Array<NoChokePlayDetails> }): number {
    const oldPlaysPp = plays.map((play, index) => Number(play.playInfo.play.pp) * Math.pow(0.95, index)).reduce((a, b) => a + b);
    const newPlaysPp = plays.map((play, index) => play.fcPerf.pp * Math.pow(0.95, index)).reduce((a, b) => a + b);
    return newPlaysPp + (user.statistics.pp - oldPlaysPp);
}

export function getUsernameFromArgs(user: UserDiscord, args?: Array<string>, userNotNeeded?: boolean) {
    args ||= [];
    let argsJoined = args.join(" ");

    const flagsParsed = argParser(argsJoined, flags);

    const mapRegex = /https:\/\/osu\.ppy\.sh\/(b|beatmaps|beatmapsets)\/\d+(#(osu|mania|fruits|taiko)\/\d+)?/;
    const mapRegexResult = mapRegex.exec(argsJoined);
    const beatmapId = mapRegexResult ? (/\d+$/).exec(mapRegexResult[0])![0] : null;
    argsJoined = argsJoined.replace(new RegExp(mapRegex, "i"), "");
    const parsedMods = modsParser(argsJoined);

    argsJoined = parsedMods ? argsJoined.toLowerCase().replace(parsedMods.whole.toLowerCase(), "") : argsJoined;

    const argumentString = args.length > 0 ? argsJoined.replace(/(?:\s|^)(?=\s|$)|(-\w+|\w+=\S+|https:\/\/osu\.ppy\.sh\/(b|beatmaps|beatmapsets)\/\d+(#(osu|mania|fruits|taiko)\/\d+)?)?(?=\s|$)/g, "") : "";

    if (!argumentString) {
        const userData = getUserData(user.id).data;

        if (userNotNeeded) {
            let _user = undefined;
            try {
                const parsedData = JSON.parse(userData);
                _user = parsedData.banchoId || errMsg(`The Discord user <@${user.id}> hasn't linked their account to the bot yet!`);
            } catch (_) {}

            return { user: _user, flags: flagsParsed, beatmapId, mods: parsedMods };
        }
        return { user: userData ? JSON.parse(userData).banchoId : errMsg(`The Discord user <@${user.id}> hasn't linked their account to the bot yet!`), flags: flagsParsed, beatmapId, mods: parsedMods };
    }

    const discordUserRegex = /\d{17,18}/;
    const discordUserMatch = discordUserRegex.exec(argumentString);
    const userId = discordUserMatch ? discordUserMatch[0] : undefined;

    const userData = getUserData(userId).data;
    if (userId) {
        if (userNotNeeded) {
            let _user = undefined;
            try {
                const parsedData = JSON.parse(userData);
                _user = parsedData.banchoId || errMsg(`The Discord user <@${userId}> hasn't linked their account to the bot yet!`);
            } catch (_) {}

            return { user: _user, flags: flagsParsed, beatmapId, mods: parsedMods };
        }
        return { user: userData ? JSON.parse(userData)?.banchoId : errMsg(`The Discord user <@${userId}> hasn't linked their account to the bot yet!`), flags: flagsParsed, beatmapId, mods: parsedMods };
    }

    const osuUsernameRegex = /"(.*?)"/;
    const osuUsernameMatch = osuUsernameRegex.exec(argumentString);
    const osuUsername = osuUsernameMatch ? osuUsernameMatch[1] : argumentString || undefined;

    return osuUsername ? { user: osuUsername, flags: flagsParsed, beatmapId, mods: parsedMods } : undefined;
}

export function getPerformanceDetails({ modsArg, maxCombo, rulesetId, hitValues, mapText, accuracy }: { modsArg: Array<string>, maxCombo?: number, rulesetId: number, hitValues?: any, mapText: string, accuracy?: number }) {
    let { count_100 = 0, count_300 = 0, count_50 = 0, count_geki = 0, count_katu = 0, count_miss = 0 } = hitValues;
    count_geki = [2, 3].includes(rulesetId) ? count_geki : 0;
    count_katu = [2, 3].includes(rulesetId) ? count_katu : 0;

    const scoreParam = {
        mode: rulesetId,
        mods: modsArg.length > 0 ? mods.id(modsArg.join("")) : 0
    };
    const map = new Beatmap({ content: mapText });
    const calculator = new Calculator(scoreParam);

    const mapValues = calculator.mapAttributes(map);
    const maxPerf = calculator.performance(map);
    const curPerf = accuracy
        ? undefined
        : calculator
            .n300(count_300)
            .n100(count_100)
            .n50(count_50)
            .nMisses(count_miss)
            .combo(maxCombo ?? maxPerf.difficulty.maxCombo)
            .nGeki(count_geki)
            .nKatu(count_katu)
            .performance(map);
    const fcPerf = accuracy
        ? calculator.acc(accuracy).performance(map)
        : calculator.n300(count_300).n100(count_100).n50(count_50).nMisses(0)
            .combo(maxPerf.difficulty.maxCombo)
            .nGeki(count_geki)
            .nKatu(count_katu)
            .performance(map);

    return { mapValues, maxPerf, curPerf, fcPerf, mapId: 0, playInfo: {} as any };
}

export async function downloadMap(beatmapId: number | Array<number>) {
    // const responseDirect = await fetch(`https://api.osu.direct/osu/${beatmapId}`);
    // if (responseDirect.status !== 404) {
    //   return new TextDecoder().decode(await responseDirect.arrayBuffer());
    // }

    const downloader = new Downloader({
        rootPath: "./cache",
        filesPerSecond: 0,
        synchronous: true
    });

    const isIdArray = Array.isArray(beatmapId);
    if (isIdArray)
        downloader.addMultipleEntries(beatmapId.map((id) => new DownloadEntry({ id, save: false })));
    else {
        downloader.addSingleEntry(new DownloadEntry({
            id: beatmapId,
            save: false
        }));
    }

    const downloaderResponse = isIdArray ? await downloader.downloadAll() : await downloader.downloadSingle();
    if (!isIdArray ? downloaderResponse.status == -3 : downloaderResponse.some((item: any) => item.status == -3))
        throw new Error("ERROR CODE 409, ABORTING TASK");

    return !isIdArray ? downloaderResponse.buffer.toString() : downloaderResponse.map((response: any) => ({ id: response.id, contents: response.buffer.toString() }));
}

const findId = (embed: any) => {
    const urlToCheck = embed.url || embed.author?.url;
    return urlToCheck && !(/\/(user|u)/).test(urlToCheck) ? urlToCheck.match(/\d+/)?.[0] : null;
};

const getEmbedFromReply = async (message: Message, client: Client) => {
    const channel = client.channels.cache.get(message.channelId) as TextBasedChannel;
    if (!channel)
        return null;

    const referencedMessage = await channel.messages.fetch(message.reference?.messageId!);
    const embed = referencedMessage.embeds[0];
    return findId(embed);
};

async function cycleThroughEmbeds(message: Message, client: Client) {
    const channel = client.channels.cache.get(message.channelId) as TextBasedChannel;
    const messages = await channel.messages.fetch({ limit: 100 });

    let beatmapId;
    for (const [_id, message] of messages) {
        if (!(message.embeds.length > 0 && message.author.bot))
            continue;

        beatmapId = await findId(message.embeds[0]);
        if (beatmapId)
            break;
    }
    return beatmapId;
}
export const getBeatmapId_FromContext = async (message: Message, client: Client) => (message.reference ? await getEmbedFromReply(message, client) : cycleThroughEmbeds(message, client));

export function Interactionhandler(interaction: Message | ChatInputCommandInteraction, args?: Array<string>) {
    const isSlash = interaction.type === InteractionType.ApplicationCommand;

    const reply = async (options: any) => (isSlash ? interaction.editReply(options) : interaction.channel.send(options));
    const userArgs = isSlash ? [interaction.options.getString("user") || ""] : args || [""];
    const ppCount = isSlash ? interaction.options.getNumber("count") || 1 : 1;
    const ppValue = isSlash ? interaction.options.getNumber("pp") || 1 : 1;
    const rankValue = isSlash ? interaction.options.getNumber("rank") || 1 : 1;
    const commandName = isSlash ? [interaction.options.getString("command") || ""] : args || [""];
    const author = isSlash ? interaction.user : interaction.author;
    const mode = isSlash ? (interaction.options.getString("mode") as osuModes) || "osu" : "osu";
    const passOnly = isSlash ? interaction.options.getBoolean("passonly") || false : false;
    const index = isSlash ? interaction.options.getInteger("index") ? interaction.options.getInteger("index")! - 1 : 0 : 0;
    const subcommand = isSlash ? interaction.options.getSubcommand(false) || undefined : undefined;
    const prefix = isSlash ? interaction.options.getString("prefix") : undefined;
    const { guildId } = interaction;

    return { reply, userArgs, author, mode, passOnly, index, commandName, subcommand, guildId, prefix, ppValue, ppCount, rankValue };
}
