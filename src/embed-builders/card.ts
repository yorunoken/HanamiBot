import { browser } from "index";
import type { CardBuilderOptions } from "@type/embedBuilders";
import type { MessageReplyOptions } from "@lilybird/transformers";

export async function cardBuilder({ user }: CardBuilderOptions): Promise<MessageReplyOptions> {
    const now = performance.now();

    const page = await browser.newPage();

    const { username } = user;
    const params = `username=${username}`;

    await page.goto(`https://fun.yorunoken.com/card?${params}`, { waitUntil: "networkidle" });
    await page.setViewportSize({ width: 850, height: 600 });

    const screenshotBuffer = await page.screenshot({
        fullPage: false,
        type: "png",
    });

    await page.close();
    // await browser.close();

    console.log("Timed spent: ", performance.now() - now);

    return {
        content: `User card for ${username}`,
        // @ts-expect-error TypeScript thinks blob is incorrect type but it is.
        files: [{ file: new Blob([screenshotBuffer], { type: "image/png" }), name: `${username}.png` }],
    };
}
