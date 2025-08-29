import { getFormattedProfile } from "@utils/formatter";
import { Mode } from "@type/osu";
import type { Embed } from "lilybird";
import type { BannerBuilderOptions } from "@type/builders";

export function bannerBuilder({ user }: BannerBuilderOptions): Array<Embed.Structure> {
    const profile = getFormattedProfile(user, Mode.OSU);

    return [
        {
            author: { name: `Banner of ${profile.username}`, icon_url: profile.flagUrl, url: profile.userUrl },
            image: { url: profile.bannerUrl },
        },
    ];
}
