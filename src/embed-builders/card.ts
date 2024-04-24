import type { CardBuilderOptions } from "@type/embedBuilders";
import type { ReplyOptions } from "lilybird";

export async function cardBuilder({ user }: CardBuilderOptions): Promise<ReplyOptions> {
    const { username, statistics } = user;
    const params = `username=${username}&rank=${statistics.global_rank}&accuracy=${statistics
        .hit_accuracy}&level=${`${statistics.level.current}.${statistics.level.progress}`}&avatar=${user.avatar_url}`;

    const url = `http://localhost:8080/generateCard?${params}`;
    const response = await fetch(url);

    if (!response.ok)
        throw new Error("Failed to generate card");

    const responseData = await response.json() as { image: string };

    const imageBlob = await fetch(`data:image/png;base64,${responseData.image}`).then(async (res) => res.blob());

    return {
        content: `User card for ${username}`,
        // @ts-expect-error TypeScript thinks blob is incorrect type but it is.
        files: [ { file: imageBlob, name: `${username}.png` } ]
    };
}
