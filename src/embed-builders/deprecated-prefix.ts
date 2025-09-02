import { slashCommandIdsCache } from "@utils/cache";
import type { Embed } from "lilybird";

export function deprecatedEmbed(commandName: string): Array<Embed.Structure> {
    const configCommandId = slashCommandIdsCache.get(commandName);
    const commandMention = configCommandId ?? `/${commandName}`;

    return [
        {
            description: `This prefix command has been deprecated. Use ${commandMention} instead.`,
        },
    ];
}
