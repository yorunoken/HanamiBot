import { getUser } from "./database";
import { slashCommandsIds } from "./cache";
import { Mode } from "@type/osu";
import { UserType } from "@type/commandArgs";
import { ModsEnum } from "osu-web.js";
import type { CommandArgs, Mods, ParsedArgs, User } from "@type/commandArgs";
import type { Mod } from "osu-web.js";
import type { ApplicationCommandData, GuildInteraction, Message } from "@lilybird/transformers";

interface BeatMapSetURL {
    url: string;
    setId: string;
    gameMode: string | null;
    difficultyId: string | null;
}

interface BeatMapURL {
    url: string;
    id: string;
}

const init = "https://osu.ppy.sh/";
const index = init.length;
const name = "beatmapsets";
const nameLength = name.length;

function parseURL(url: string): BeatMapSetURL | BeatMapURL | null {
    if (!url.startsWith(init)) return null;
    if (url[index] !== "b") return null;

    if (url[index + 1] === "/") {
        return {
            url,
            id: url.substring(index + 2)
        } satisfies BeatMapURL;
    }

    if (!url.startsWith(name, index)) return null;
    const subUrl = url.substring(index + nameLength + 1);

    const slash = subUrl.indexOf("/");
    const hash = subUrl.indexOf("#");

    if (slash === -1) {
        if (hash === -1) {
            return {
                url,
                setId: subUrl,
                gameMode: null,
                difficultyId: null
            } satisfies BeatMapSetURL;
        }

        return {
            url,
            setId: subUrl.substring(0, hash),
            gameMode: subUrl.substring(hash + 1),
            difficultyId: null
        } satisfies BeatMapSetURL;
    }

    return {
        url,
        setId: subUrl.substring(0, hash),
        gameMode: subUrl.substring(hash + 1, slash),
        difficultyId: subUrl.substring(slash + 1)
    } satisfies BeatMapSetURL;
}

function linkCommand(): string | undefined {
    return slashCommandsIds.get("link");
}

export function getCommandArgs(interaction: GuildInteraction<ApplicationCommandData>): CommandArgs | undefined {
    const username = interaction.data.getString("username");
    const author = getUser(interaction.member.user.id);
    const discordUserId = interaction.data.getUser("discord");
    const discordUser = getUser(discordUserId ?? "");
    const mode = <Mode | undefined>interaction.data.getString("mode") ?? Mode.OSU;

    let mods: Mods = {
        exclude: null,
        include: null,
        forceInclude: null,
        name: null
    };

    const modsValue = interaction.data.getString("mods");
    const modSections = modsValue?.toUpperCase().match(/.{1,2}/g);
    if (modSections && !modSections.every((selectedMod) => selectedMod in ModsEnum || modsValue === "NM")) {
        mods = {
            exclude: interaction.data.getBoolean("exclude") ?? null,
            include: interaction.data.getBoolean("include") ?? null,
            forceInclude: interaction.data.getBoolean("force_include") ?? null,
            name: <Mod | undefined>modsValue ?? null
        };
    }

    const urlMatch = parseURL(interaction.data.getString("map") ?? "");
    let beatmapId: string | null = null;
    if (urlMatch && "id" in urlMatch)
        beatmapId = urlMatch.id;
    else if (urlMatch && "setId" in urlMatch)
        beatmapId = urlMatch.difficultyId;

    const user: User = discordUserId
        ? discordUser?.banchoId
            ? { type: UserType.SUCCESS, banchoId: discordUser.banchoId, authorDb: author, mode, beatmapId }
            : {
                type: UserType.FAIL,
                beatmapId,
                authorDb: author,
                failMessage: discordUserId ? `The user <@${discordUserId}> hasn't linked their account to the bot yet!` : `Please link your account to the bot using ${linkCommand()}!`
            }
        : username
            ? { type: UserType.SUCCESS, banchoId: username, mode, beatmapId, authorDb: author }
            : author?.banchoId
                ? { type: UserType.SUCCESS, banchoId: author.banchoId, mode, beatmapId, authorDb: author }
                : { type: UserType.FAIL, beatmapId, authorDb: author, failMessage: "Please link your account to the bot using /link!" };

    return { user, mods };
}

export function parseOsuArguments(message: Message, args: Array<string>, mode: Mode): ParsedArgs {
    const result: ParsedArgs = {
        tempUser: null,
        user: {
            beatmapId: null,
            type: UserType.FAIL,
            failMessage: `Please link your account to the bot using ${linkCommand()}!`,
            authorDb: null
        },
        flags: {},
        mods: {
            exclude: null,
            include: null,
            forceInclude: null,
            name: null
        }
    };

    const mapLinkMatches: Array<BeatMapSetURL | BeatMapURL> = [];
    for (let i = 0; i < args.length; i++) {
        const parsedUrl = parseURL(args[i]);
        if (parsedUrl !== null)
            mapLinkMatches.push(parsedUrl);
    }

    if (mapLinkMatches.length > 0) {
        // Get the first array of `mapLinkMatches`
        const [firstMatch] = mapLinkMatches;

        // Extract beatmap ID from link
        const beatmapId = "id" in firstMatch ? firstMatch.id : firstMatch.difficultyId;
        result.user.beatmapId = beatmapId;

        // Remove the map link from args array
        const indexToRemove = args.findIndex((link) => link === firstMatch.url);
        args.splice(indexToRemove, 1);
    }

    const newArgs = args.join(" ").match(/(".*?"|\S+)/g) ?? [];
    for (let i = 0; i < newArgs.length; i++) {
        const arg = newArgs[i];

        if (arg.includes('"')) {
            (result.tempUser ??= []).push(arg.replace(/"/g, ""));
            continue;
        }

        const [key, value] = arg.split("=");
        const [, modType, mod, force] = (/^([+-])([A-Za-z]+)(!)?$/).exec(arg) ?? [];

        if (mod) {
            const modSections = (/.{1,2}/g).exec(mod);

            // Make sure `mod` is an actual mod in osu!
            if (modSections && !modSections.every((selectedMod) => selectedMod.toUpperCase() in ModsEnum || mod.toUpperCase() === "NM"))
                continue;

            result.mods.include = modType !== "-";
            result.mods.exclude = modType === "-" && typeof force !== "undefined";
            result.mods.forceInclude = modType === "+" && typeof force !== "undefined";
            if (result.mods.include || result.mods.exclude || result.mods.forceInclude) {
                result.mods.name = mod.replaceAll(/\+|!|-/g, "").toUpperCase() as Mod;
                continue;
            }
        }

        // Check if it's a username
        if (key && !value) {
            (result.tempUser ??= []).push(key);
            continue;
        }

        //  Check if it's a "=" value
        if (key && value)
            result.flags[key] = value;
    }

    const userAuthor = getUser(message.author.id);

    if (!result.tempUser && userAuthor?.banchoId) {
        result.user = {
            beatmapId: result.user.beatmapId,
            type: UserType.SUCCESS,
            banchoId: userAuthor.banchoId,
            authorDb: userAuthor,
            mode
        };
    } else if (result.tempUser) {
        const [userArg] = result.tempUser;

        const discordUserId = (/<@(\d+)>/).exec(userArg)?.[1];
        const discordUser = discordUserId ? getUser(discordUserId) : null;
        const discordId = discordUserId ? discordUser?.banchoId : null;

        if (discordUserId && !discordId) {
            result.user = {
                beatmapId: result.user.beatmapId,
                type: UserType.FAIL,
                authorDb: userAuthor,
                failMessage: `The user <@${discordUserId}> hasn't linked their account to the bot yet!`
            };
        } else {
            result.user = {
                beatmapId: result.user.beatmapId,
                type: UserType.SUCCESS,
                banchoId: discordId ?? userArg,
                authorDb: userAuthor,
                mode
            };
        }
    }

    return result;
}
