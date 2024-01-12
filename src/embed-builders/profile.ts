import { EmbedType } from "lilybird";
import type { response as User } from "osu-api-extended/dist/types/v2_user_details";

export function profileBuilder(user: User) {
    return { type: EmbedType.Rich };
}
