import { getUser } from "./database";
import { linkSlash } from "./constants";
import { InteractionType } from "lilybird";
import type { Modes } from "../types/osu";
import type { CommandArgs, ParsedArgs, User } from "../types/commandArgs";
import type { ApplicationCommandData, Interaction, Message } from "lilybird";

export function getCommandArgs(interaction: Interaction<ApplicationCommandData> | Message): CommandArgs {
    if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.inGuild()) {
        const { data, member } = interaction;

        const userArg = data.getString("username");
        const userId = getUser(member.user.id)?.banchoId;
        const discordUserId = data.getUser("discord");
        const discordUser = getUser(discordUserId ?? "")?.banchoId;

        // why cpol
        const mode: Modes = data.getString("mode") as Modes | undefined ?? "osu";

        const user: User = discordUserId
            ? discordUser
                ? { type: "success", banchoId: discordUser, mode }
                : { type: "fail", failMessage: discordUserId ? `The user <@${discordUserId}> hasn't linked their account to the bot yet!` : `Please link your account to the bot using ${linkSlash}!` }
            : userArg
                ? { type: "success", banchoId: userArg, mode }
                : userId
                    ? { type: "success", banchoId: userId, mode }
                    : { type: "fail", failMessage: "Please link your account to the bot using /link!" };

        return { user };
    }
}

export function parseOsuArguments(message: Message, args: Array<string>, mode: Modes): ParsedArgs {
    const result: ParsedArgs = {
        tempUserDoNotUse: null,
        user: {
            type: "fail",
            failMessage: `Please link your account to the bot using ${linkSlash}!`
        },
        flags: {},
        mods: {
            exclude: null,
            include: null,
            forceInclude: null,
            name: null
        }
    };

    // Counter to keep track of double-quote and flag occurrences
    let quoteCounts = 0;

    for (const arg of args) {
        const [key, value] = arg.split("=");

        const [, modType, mod, force] = (/^([+-])([A-Za-z]+)(!)?$/).exec(arg) ?? [];

        if (mod) {
            result.mods.include = modType !== "-";
            result.mods.exclude = modType === "-" && typeof force !== "undefined";
            result.mods.forceInclude = modType === "+" && typeof force !== "undefined";
            if (result.mods.include || result.mods.exclude || result.mods.forceInclude) {
                result.mods.name = mod.replaceAll(/\+|!|-/g, "");
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
            type: "success",
            banchoId: userId,
            mode
        };
    } else if (result.tempUserDoNotUse) {
        const discordUserId = (/<@!?(\d+)>/).exec(result.tempUserDoNotUse.join(" "))?.[1];
        const discordUser = getUser(discordUserId ?? "")?.banchoId;

        if (discordUserId && !discordUser) {
            result.user = {
                type: "fail",
                failMessage: `The user <@${discordUserId}> hasn't linked their account to the bot yet!`
            };
        } else {
            result.user = {
                type: "success",
                banchoId: discordUser ?? result.tempUserDoNotUse.join(" "),
                mode
            };
        }
    }

    return result;
}
