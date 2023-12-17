import type { Message, SlashCommandBuilder, User } from "discord.js";
import type { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import type { MapAttributes, PerformanceAttributes } from "rosu-pp";

export interface PrefixCommands {
    name: string;
    aliases: Array<string>;
    cooldown: number;
    description: string;
    flags?: string;
    run: (options: Record<string, any>) => Promise<void>;
}

export interface SlashCommands {
    run: (options: Record<string, any>) => Promise<void>;
    data: SlashCommandBuilder;
}

export enum PrefixMethods {
    ADD = "add",
    REMOVE = "remove",
    LIST = "list"
}

export enum Commands {
    Recent = 0,
    Top = 1,
    Profile = 2
}

export interface EmbedOptions {
    length: number;
    index?: number;
    locale: any;
    options?: UserInfo;
    plays: {
        length: number
    };
    page?: number;
}

export interface CommandInterface {
    initializer: User;
    buttonHandler?: "handleProfileButtons" | "handleRecentButtons" | "handleTopsButtons";
    type: Commands;
    embedOptions: EmbedOptions;
    response: Message;
    pageBuilder?: <T>(...args: Array<any>) => T;
}

export type CallbackVoid = (value?: any) => void;
export type osuModes = "osu" | "mania" | "fruits" | "taiko";
export type tables = "maps" | "servers" | "users";

export interface ModuleReturn {
    aliases: Array<string>;
    cooldown: number;
    description: string;
    flags: string;
    name: string;
    run: <T>(...args: Array<any>) => T;
}

export interface BeatmapInfo {
    title: string;
    artist: string;
    version: string;
    mode: string;
    id: number;
    setId: number;
    creator: string;
    rulesetId: number;
    totalObjects: number;
    stars: string;
    mods: string;
    bpm: string;
    totalLength: string | number;
    mapLength: string;
    maxCombo: number;
    ar: string;
    od: string;
    hp: string;
    cs: string;
    favorited: string;
    playCount: string;
    ppValues: string;
    links: string;
    background: string;
    updatedAt: string;
    modeEmoji: string;
}

export interface ScoreInfo {
    performance: any;
    retries?: number;
    percentagePassed: string;
    modsPlay: string;
    beatmapId: number;
    globalPlacement: string;
    countCircles: number;
    countSliders: number;
    countSpinners: number;
    hitLength: number;
    placement: number;
    version: string;
    creatorId: number;
    creatorUsername: string;
    mapStatus: string;
    mapsetId: number;
    count100: number;
    count300: number;
    count50: number;
    countGeki: number;
    countKatu: number;
    countMiss: number;
    totalScore: string;
    accuracy: string;
    artist: string;
    title: string;
    grade: string;
    submittedTime: number;
    minutesTotal: string;
    secondsTotal: string;
    bpm: string;
    mapValues: string;
    stars: string;
    accValues: string;
    comboValue: string;
    pp: string | undefined;
    fcPp: string;
    ssPp: string;
    totalResult: string;
    ifFcValue: string;
}

export interface UserInfo {
    locale: any;
    username: string;
    userCover: string;
    userAvatar: string;
    userUrl: string;
    coverUrl: string;
    userFlag: string;
    countryCode: string;
    globalRank: string;
    countryRank: string;
    pp: string;
    rankedScore: string;
    totalScore: string;
    objectsHit: string;
    occupation: string;
    interest: string;
    location: string;
    highestRank?: string;
    highestRankTime?: number;
    recommendedStarRating: string;
    userJoinedAgo: string;
    formattedDate: string;
    accuracy: string;
    level: string;
    playCount: string;
    playHours: string;
    followers: string;
    maxCombo: string;
    rankS: string;
    rankA: string;
    rankSs: string;
    rankSh: string;
    rankSsh: string;
    emoteA: string;
    emoteS: string;
    emoteSh: string;
    emoteSs: string;
    emoteSsh: string;
}

export interface NoChokePlayDetails {
    mapValues: MapAttributes;
    maxPerf: PerformanceAttributes;
    curPerf: PerformanceAttributes | undefined;
    fcPerf: PerformanceAttributes;
    mapId: number;
    playInfo: {
        play: ScoreResponse,
        misses: number,
        grade: string
    };
}

interface Embeds {
    page: (page: string) => string;
    otherPlays: string;
    provideUsername: string;
    prefix: {
        provideFlags: string,
        prefixAlreadySet: (prefix: string) => string,
        maxPrefix: (maxPrefix: string) => string,
        prefixAdded: (prefix: string) => string,
        noPrefixes: string,
        serverDoesntHavePrefix: string,
        prefixRemoved: (prefix: string) => string,
        currentPrefixes: (prefixes: string) => string
    };
    help: {
        title: string,
        commandNotFound: (name: string) => string,
        commandInfoTitleEmbed: (name: string) => string,
        botInfo: string,
        botServerCount: (length: string) => string,
        botUptime: (uptime: string) => string,
        commands: string
    };
    leaderboard: {
        noScores: string,
        global: string,
        country: string,
        type: (type: string) => string,
        playScore: (userId: string | number) => string
    };
    map: {
        beatmapBy: (username: string) => string,
        stars: string,
        mods: string,
        length: string,
        maxCombo: string,
        objects: string,
        links: string,
        ranked: string,
        loved: string,
        qualified: string,
        pending: string,
        graveyard: string
    };
    link: {
        success: (id: string | number, username: string) => string
    };
    plays: {
        top: string,
        recent: string,
        noScores: (username: string, type: string) => string,
        playsFound: (length: number) => string,
        try: string,
        length: string,
        mapper: (username: string) => string
    };
    whatif: {
        count: string,
        plural: string,
        samePp: (pp: string | number, username: string) => string,
        title: (username: string, count: string | number, pp: string | number, plural: string) => string,
        description: (
            length: string | number,
            pp: string | number,
            username: string,
            plural: string,
            position: string | number,
            newPp: string | number,
            diffPp: string | number,
            rank: string | number,
            rankDiff: string | number) => string
    };
    pp: {
        ppHigh: (username: string) => string,
        playerMissing: (username: string, pp: string | number) => string,
        description: (username: string, target: string | number, pp: string | number, position: string | number, rank: string | number) => string
    };
    rank: {
        rankHigh: (username: string) => string,
        playerMissing: (username: string, rank: string | number) => string,
        description: (username: string, target: string | number, pp: string | number, position: string | number, newPp: string | number) => string
    };
    profile: {
        peakRank: string,
        achieved: string,
        statistics: string,
        accuracy: string,
        level: string,
        playcount: string,
        followers: string,
        maxCombo: string,
        recommendedStars: string,
        grades: string,
        joinDate: (date: string, ago: string | number) => string,
        score: string,
        rankedScore: string,
        totalScore: string,
        objectsHit: string,
        profile: string
    };
    nochoke: {
        alreadyDownloading: (username: string) => string,
        mapsDownloaded: string,
        mapsArentInDb: (username: string, missingMaps: string | number) => string,
        approximateRank: (pp: string | number, rank: string | number) => string
    };
}

interface Classes {
    occupation: string;
    interests: string;
    location: string;
    globalRank: string;
    ifFc: (accuracy: string, pp: string | number) => string;
    songPreview: string;
    mapPreview: string;
    fullBackground: string;
    ranked: string;
    loved: string;
    qualified: string;
    updatedAt: string;
}

interface Fails {
    languageDoesntExist: string;
    channelDoesntExist: string;
    linkFail: string;
    userDoesntExist: (user: string) => string;
    userHasNoScores: (user: string) => string;
    provideValidPage: (maxValue: string | number) => string;
    noLeaderboard: string;
    noBeatmapIdInCtx: string;
    error: string;
    interactionError: string;
    cooldownTime: (cooldown: string) => string;
    userButtonNotAllowed: string;
}

interface Modals {
    enterValue: string;
    valueInsert: (maxValue: string | number) => string;
}

interface Misc {
    success: string;
    warning: string;
    poweredBy: string;
    feedbackSent: string;
    languageSet: (language: string) => string;
}

export interface Locales {
    code: string;
    errorAtRuntime: string;
    embeds: Embeds;
    classes: Classes;
    fails: Fails;
    modals: Modals;
    misc: Misc;
}

export interface DbUser {
    id: string;
    banchoId: string;
}

export interface DbServer {
    id: number;
    prefix: string;
    language: string;
}

export interface DbMaps {
    id: string;
    data: string;
}

export interface DbCommands {
    name: string;
    count: number;
}
