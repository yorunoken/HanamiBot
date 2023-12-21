import { start as map } from "./map";
import type { Message } from "discord.js";

const functions: Record<string, (arg: any) => void> = {
    map
};

export function getLoneCommand(message: Message): void {
    const url = message.content;

    const res = (/osu\.ppy\.sh\/users\/\d+/).test(url) ?
        { id: (/\d+/).exec(url)?.[0], type: "user" } :
        (/osu\.ppy\.sh\/(b|beatmaps)\/\d+|osu\.ppy\.sh\/beatmapsets\/(\d+)/).test(url) ? { id: (/\d+$/).exec(url)?.[0], type: "map" } : undefined;
    if (!res || res.type === "user") return; // temporarily disabled `user`

    functions[res.type](res.type === "map" ? { interaction: message, mapId: res.id, args: [""] } : "");
}
