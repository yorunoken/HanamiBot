import { getProfile } from "../cleaners/profile";
import type { Modes } from "../types/osu";
import type { User } from "osu-web.js";
import type { EmbedStructure } from "lilybird";

export async function playBuilder(user: User, mode: Modes): Promise<EmbedStructure> {
    const profile = getProfile(user, mode);
}
