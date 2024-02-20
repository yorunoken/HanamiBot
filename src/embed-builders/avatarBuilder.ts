import { getProfile } from "../cleaners/profile";
import { Mode } from "../types/osu";
import type { EmbedStructure } from "lilybird";
import type { AvatarBuilderOptions } from "../types/embedBuilders";

export function avatarBuilder({ user }: AvatarBuilderOptions): Array<EmbedStructure> {
    const profile = getProfile(user, Mode.OSU);

    return [ { author: { name: `Profile avatar of ${profile.username}`, icon_url: profile.flagUrl, url: profile.userUrl }, image: { url: profile.avatarUrl } } ];
}
