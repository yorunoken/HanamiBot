import { getServer, insertData } from "@utils/database";
import type { NewGuild } from "@lilybird/transformers";
import type { UnavailableGuildStructure } from "lilybird";
import type { Event } from "@lilybird/handlers";

export const prefixesCache = new Map<string, Array<string>>();

export default {
    event: "guildCreate",
    run: (guild: UnavailableGuildStructure | NewGuild) => {
        const document = getServer(guild.id);

        if (document === null) {
            const basicData: Array<{ name: string, value: string | number | null }> = [ { name: "prefixes", value: null } ];

            if ("name" in guild) {
                basicData.push(
                    { name: "name", value: guild.name },
                    { name: "owner_id", value: guild.ownerId },
                    { name: "joined_at", value: guild.joinedAt }
                );
            }

            insertData({ table: "servers", id: guild.id, data: basicData });
        } else if ("name" in guild) {
            insertData({
                table: "servers",
                id: guild.id,
                data: [
                    { name: "name", value: guild.name },
                    { name: "owner_id", value: guild.ownerId },
                    { name: "joined_at", value: guild.joinedAt }
                ]
            });
        }

        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (document !== null && document.prefixes !== null)
            prefixesCache.set(guild.id, document.prefixes);
    }
} satisfies Event<"guildCreate">;
