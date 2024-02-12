import { compareBuilder, leaderboardBuilder, mapBuilder, playBuilder, profileBuilder } from "../embed-builders";
import { EmbedBuilderType } from "../types/embedBuilders";
import type { EmbedStructure } from "lilybird";
import type { EmbedBuilderOptions } from "../types/embedBuilders";

export async function returnUpdatedEmbed(options: EmbedBuilderOptions): Promise<Array<EmbedStructure>> {
    switch (options.builderType) {
        case EmbedBuilderType.COMPARE:
            return compareBuilder(options);
        case EmbedBuilderType.LEADERBOARD:
            return leaderboardBuilder(options);
        case EmbedBuilderType.MAP:
            return mapBuilder(options);
        case EmbedBuilderType.PLAYS:
            return playBuilder(options);
        case EmbedBuilderType.PROFILE:
            return profileBuilder(options);
    }
}
