import { getUser } from "./database";
import { InteractionType } from "lilybird";
import type { modes } from "../types/osu";
import type { CommandArgs, User } from "../types/commandArgs";
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
