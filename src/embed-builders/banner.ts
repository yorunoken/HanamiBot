import { getProfile } from "@utils/profile-processor";
import { Mode } from "@type/osu";
import type { Embed } from "lilybird";
import type { BannerBuilderOptions } from "@type/embedBuilders";

export function bannerBuilder({ user }: BannerBuilderOptions): Array<Embed.Structure> {
    const profile = getProfile(user, Mode.OSU);

    return [
        {
            author: { name: `Banner of ${profile.username}`, icon_url: profile.flagUrl, url: profile.userUrl },
            image: { url: profile.bannerUrl },
        },
    ];
}
