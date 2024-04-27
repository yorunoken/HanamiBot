import { browser } from "index";
import type { CardBuilderOptions } from "@type/embedBuilders";
import type { ReplyOptions } from "lilybird";

export async function cardBuilder({ user }: CardBuilderOptions): Promise<ReplyOptions> {
    const page = await browser.newPage();

    const { username, statistics } = user;
    const params = `username=${username}&rank=${statistics.global_rank}&accuracy=${statistics
        .hit_accuracy}&level=${`${statistics.level.current}.${statistics.level.progress}`}&avatar=${user.avatar_url}`;

    const url = `https://fun.yorunoken.com/osucard?${params}`;
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.setViewport({ width: 600, height: 800 });

    const screenshotBuffer = await page.screenshot({
        fullPage: false,
        type: "png"
    });

    await page.close();

    return {
        content: `User card for ${username}`,
        // @ts-expect-error TypeScript thinks blob is incorrect type but it is.
        files: [ { file: new Blob([screenshotBuffer], { type: "image/png" }), name: `${username}.png` } ]
    };
}
