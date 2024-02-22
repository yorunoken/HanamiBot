import { getProfile } from "../cleaners/profile";
import { Mode } from "../types/osu";
import type { EmbedStructure } from "lilybird";
import type { BannerBuilderOptions } from "../types/embedBuilders";

export function bannerBuilder({ user }: BannerBuilderOptions): Array<EmbedStructure> {
    const profile = getProfile(user, Mode.OSU);

    return [
        {
            author: { name: `Banner of ${profile.username}`, icon_url: profile.flagUrl, url: profile.userUrl },
            image: { url: profile.bannerUrl }
        }
    ];
}
