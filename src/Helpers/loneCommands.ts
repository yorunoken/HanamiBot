import { start as map } from "./map";
import type { Message } from "discord.js";

const functions: Record<string, (arg: any) => void> = {
    map
};

/**
 * Parses a Discord message content URL to extract an osu! user ID or beatmap ID.
 * Checks the URL against regex patterns for user and beatmap URLs.
 * Returns an object with the extracted ID and type if a match is found,
 * otherwise returns undefined.
*/
export function getLoneCommand(message: Message): void {
    const url = message.content;

    const res = (/osu\.ppy\.sh\/users\/\d+/).test(url) ?
        { id: (/\d+/).exec(url)?.[0], type: "user" } :
        (/osu\.ppy\.sh\/(b|beatmaps)\/\d+|osu\.ppy\.sh\/beatmapsets\/(\d+)/).test(url) ? { id: (/\d+$/).exec(url)?.[0], type: "map" } : undefined;
    if (!res || res.type === "user") return; // temporarily disabled `user`

    functions[res.type](res.type === "map" ? { interaction: message, mapId: res.id, args: [""] } : "");
}
