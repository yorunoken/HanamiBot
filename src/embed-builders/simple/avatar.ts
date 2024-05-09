import { Mode } from "@type/osu";
import { getProfile } from "@cleaners/profile";
import type { Embed } from "lilybird";
import type { AvatarBuilderOptions } from "@type/embedBuilders";

export function avatarBuilder({ user }: AvatarBuilderOptions): Array<Embed.Structure> {
    const profile = getProfile(user, Mode.OSU);

    return [
        {
            author: { name: `Profile avatar of ${profile.username}`, icon_url: profile.flagUrl, url: profile.userUrl },
            image: { url: profile.avatarUrl }
        }
    ];
}
