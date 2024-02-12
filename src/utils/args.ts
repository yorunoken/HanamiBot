import { Mode } from "../types/osu";
import { UserType } from "../types/commandArgs";
import { getUser } from "./database";
import { slashCommandsIds } from "./ cache";
import { ModsEnum } from "osu-web.js";
import type { CommandArgs, Mods, ParsedArgs, User } from "../types/commandArgs";
import type { Mod } from "osu-web.js";
import type { ApplicationCommandData, Interaction, Message } from "lilybird";

function linkMatcher(link: string): RegExpExecArray | null {
    return (/^https:\/\/osu\.ppy\.sh\/(beatmapsets|b)\/(?:\d+\/)?(\d+)$/).exec(link);
}

function linkCommand(): string | undefined {
    return slashCommandsIds.get("link");
}

export function getCommandArgs(interaction: Interaction<ApplicationCommandData>): CommandArgs | undefined {
    if (!interaction.isApplicationCommandInteraction() || !interaction.inGuild()) return;

    const userArg = interaction.data.getString("username");
    const userId = getUser(interaction.member.user.id)?.banchoId;
    const discordUserId = interaction.data.getUser("discord");
    const discordUser = getUser(discordUserId ?? "")?.banchoId;
    const mode = <Mode | undefined>interaction.data.getString("mode") ?? Mode.OSU;

    let mods: Mods = {
        exclude: null,
        include: null,
        forceInclude: null,
        name: null
    };

    const modsValue = interaction.data.getString("mods");
    const modSections = modsValue?.match(/.{1,2}/g);
    if (modSections && !modSections.every((selectedMod) => selectedMod.toUpperCase() in ModsEnum || modsValue?.toUpperCase() === "NM")) {
        mods = {
            exclude: interaction.data.getBoolean("exclude") ?? null,
            include: interaction.data.getBoolean("include") ?? null,
            forceInclude: interaction.data.getBoolean("force_include") ?? null,
            name: <Mod | undefined>modsValue ?? null
        };
    }

    const urlMatch = linkMatcher(interaction.data.getString("map") ?? "");
    const beatmapId = urlMatch?.[2] ?? null;

    const user: User = discordUserId
        ? discordUser
            ? { type: UserType.SUCCESS, banchoId: discordUser, mode, beatmapId }
            : {
                type: UserType.FAIL,
                beatmapId,
                failMessage: discordUserId ? `The user <@${discordUserId}> hasn't linked their account to the bot yet!` : `Please link your account to the bot using ${linkCommand()}!`
            }
        : userArg
            ? { type: UserType.SUCCESS, banchoId: userArg, mode, beatmapId }
            : userId
                ? { type: UserType.SUCCESS, banchoId: userId, mode, beatmapId }
                : { type: UserType.FAIL, beatmapId, failMessage: "Please link your account to the bot using /link!" };

    return { user, mods };
}

export function parseOsuArguments(message: Message, args: Array<string>, mode: Mode): ParsedArgs {
    const result: ParsedArgs = {
        tempUserDoNotUse: null,
        user: {
            beatmapId: null,
            type: UserType.FAIL,
            failMessage: `Please link your account to the bot using ${linkCommand()}!`
        },
        flags: {},
        mods: {
            exclude: null,
            include: null,
            forceInclude: null,
            name: null
        }
    };

    const mapLinkMatch = linkMatcher(args.join(" "));
    if (mapLinkMatch) {
        // Extract beatmap ID from link
        const beatmapId = mapLinkMatch[mapLinkMatch.length - 1];
        result.user.beatmapId = beatmapId;

        // Remove the map link from args array
        const indexToRemove = args.findIndex((link) => link === mapLinkMatch[0]);
        args.splice(indexToRemove, 1);
    }

    // Counter to keep track of double-quote and flag occurrences
    let quoteCounts = 0;

    for (const arg of args) {
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
                result.mods.name = mod.replaceAll(/\+|!|-/g, "") as Mod;
                continue;
            }
        }

        // Check if it's a username (key without value) and within quote limits
        if (key && !value && quoteCounts < 2) {
            // Increase quote count if the key includes double-quotes
            // This is to select the first username in quotes
            if (key.includes('"')) quoteCounts++;

            (result.tempUserDoNotUse ??= []).push(key.replace(/"/g, ""));
            continue;
        }

        //  Check if it's a "=" value
        if (key && value)
            result.flags[key] = value;
    }

    const userId = getUser(message.author.id)?.banchoId;

    if (!result.tempUserDoNotUse && userId) {
        result.user = {
            beatmapId: result.user.beatmapId,
            type: UserType.SUCCESS,
            banchoId: userId,
            mode
        };
    } else if (result.tempUserDoNotUse) {
        const discordUserId = (/<@(\d+)>/).exec(result.tempUserDoNotUse.join(" "))?.[1];
        const user = discordUserId ? getUser(discordUserId)?.banchoId : null;

        if (discordUserId && !user) {
            result.user = {
                beatmapId: result.user.beatmapId,
                type: UserType.FAIL,
                failMessage: `The user <@${discordUserId}> hasn't linked their account to the bot yet!`
            };
        } else {
            result.user = {
                beatmapId: result.user.beatmapId,
                type: UserType.SUCCESS,
                banchoId: user ?? result.tempUserDoNotUse.join(" "),
                mode
            };
        }
    }

    return result;
}
