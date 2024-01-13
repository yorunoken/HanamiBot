import { getUser } from "./database";
import { InteractionType } from "lilybird";
import type { modes } from "../types/osu";
import type { CommandArgs, ParsedArgs, User } from "../types/commandArgs";
import type { ApplicationCommandData, Interaction, Message } from "lilybird";

export function getCommandArgs(interaction: Interaction<ApplicationCommandData> | Message): CommandArgs {
    if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.inGuild()) {
        const { data, member } = interaction;

        const username = data.getString("username") ?? getUser(member.user.id)?.banchoId;
        const discordUserId = data.getUser("discord");
        const discordUser = getUser(discordUserId ?? "")?.banchoId;

        // why cpol
        const mode: modes = data.getString("mode") as modes | undefined ?? "osu";

        const user: User = discordUser
            ? { type: "success", banchoId: discordUser, mode }
            : username
                ? { type: "success", banchoId: username, mode }
                : { type: "fail", failMessage: discordUserId ? `The user <@${discordUserId}> hasn't linked their account to the bot yet!` : "Please link your account to the bot using /link!" };

        return { user };
    }

    // Placeholder until I get the message command logic in place
    return "" as unknown as CommandArgs;
}

export function parseOsuArguments(args: Array<string>): ParsedArgs {
    const result: ParsedArgs = {
        username: null,
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

        const [, modType, mod, excl] = (/^(?!.*")([+-]?)([A-Z]+)(!)?$/).exec(arg) ?? [];

        if (mod) {
            result.mods.include = modType !== "-";
            result.mods.exclude = modType === "-" && typeof excl !== "undefined";
            result.mods.forceInclude = modType === "+" && typeof excl !== "undefined";
            result.mods.name = mod.replaceAll(/\+|!|-/g, "");
            continue;
        }

        if (key && !value && quoteCounts < 2) { // Check if it's a username (key without value) and within quote limits
            // Increase quote count if the key includes double-quotes
            // This is to select the first username in quotes
            if (key.includes('"')) quoteCounts++;

            (result.username ??= []).push(key.replace(/"/g, ""));

            continue;
        }

        if (key && value) {
            //  Check if it's a "=" value
            result.flags[key] = value;
        }
    }

    return result;
}
