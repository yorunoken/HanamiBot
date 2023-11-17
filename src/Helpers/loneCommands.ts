import { start as user } from "./osu";
import { start as map } from "./map";
import { Message } from "discord.js";

const functions: { [key: string]: Function } = {
  map,
  user,
};

export function getLoneCommand(message: Message) {
  const url = message.content;

  const res = /osu\.ppy\.sh\/users\/\d+/.test(url) ? { id: url.match(/\d+/)?.[0], type: "user" } : /osu\.ppy\.sh\/(b|beatmaps)\/\d+|osu\.ppy\.sh\/beatmapsets\/(\d+)/.test(url) ? { id: url.match(/\d+$/)?.[0], type: "map" } : undefined;
  if (!res || res.type === "user") return; // temporarily disabled `user`

  functions[res.type](res.type === "map" ? { interaction: message, mapId: res.id, args: [""] } : "");
}
