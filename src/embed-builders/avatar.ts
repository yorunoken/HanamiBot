import { Mode } from "@type/osu";
import { getFormattedProfile } from "@utils/formatter";
import type { Embed } from "lilybird";
import type { AvatarBuilderOptions } from "@type/builders";

export function avatarBuilder({ user }: AvatarBuilderOptions): Array<Embed.Structure> {
    const profile = getFormattedProfile(user, Mode.OSU);

    return [
        {
            author: { name: `Profile avatar of ${profile.username}`, icon_url: profile.flagUrl, url: profile.userUrl },
            image: { url: profile.avatarUrl },
        },
    ];
}
