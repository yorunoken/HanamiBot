import { getProfile } from "../cleaners/profile";
import { client } from "../utils/initalize";
import type { Modes } from "../types/osu";
import type { UserExtended } from "osu-web.js";
import type { EmbedStructure } from "lilybird";

export async function playBuilder(user: UserExtended, mode: Modes, type: "best" | "firsts" | "recent"): Promise<EmbedStructure> {
    const profile = getProfile(user, mode);
    const plays = await client.users.getUserScores(user.id, type, { query: { mode, limit: 100 } });
}
