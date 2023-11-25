import { Message, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { MyClient } from "../classes";
import { osuModes } from "../types";
import { getUser } from "../functions";
import { response as UserResponse } from "osu-api-extended/dist/types/v2_user_details";

import { response as ScoreResponse } from "osu-api-extended/dist/types/v2_scores_user_category";
import { Interactionhandler, downloadMap, getMapsInBulk, getUsernameFromArgs, insertDataBulk } from "../utils";
import { v2 } from "osu-api-extended";

export async function start({ interaction, args, mode, client }: { interaction: Message | ChatInputCommandInteraction; args?: string[]; mode?: osuModes; client: MyClient }) {
  const interactionOptions = Interactionhandler(interaction, args);
  const { reply, author, userArgs } = interactionOptions;
  mode = (mode ?? interactionOptions.mode) as osuModes;

  const options = getUsernameFromArgs(author, userArgs);
  if (!options || options.user?.status === false) {
    return reply(options?.user.message ?? "Something went wrong.");
  }

  const user = await v2.user.details(options.user, interactionOptions.mode);
  if (!user.id) {
    return reply(`The user \`${options.user}\` does not exist in Bancho.`);
  }

  let plays = await v2.scores.user.category(user.id, "best", {
    limit: "5",
    mode,
  });
  plays = options.flags.rev ? plays.sort((a, b) => Number(a.pp) - Number(b.pp)) : plays;
  getNoChoke(plays, user, reply);
}

async function getNoChoke(plays: ScoreResponse[], user: UserResponse, reply: (options: any) => Promise<Message<boolean>>) {
  const files = getFiles(plays, user, reply);
}

async function getFiles(plays: ScoreResponse[], user: UserResponse, reply: (options: any) => Promise<Message<boolean>>) {
  const mapIds = plays.map((play) => play.beatmap.id);
  let mapsInBulk = getMapsInBulk(mapIds);
  const missingMapIds = mapIds.filter((id) => !mapsInBulk.some((map: any) => map.id === id));
  if (missingMapIds.length > 0) {
    const message = await reply({ embeds: [new EmbedBuilder().setTitle("Warning!").setDescription(`\`${missingMapIds.length}\`of ${user.username}'s plays are not in the bot's database. Please wait while the bot is download your maps.`).setColor("Red")] });
    const data = (await downloadMap(mapIds)).map((map: any) => ({ id: map.id, data: map.contents }));
    insertDataBulk({
      table: "maps",
      object: data,
    });
    data.forEach((map: any) => {
      mapsInBulk = [...mapsInBulk, map];
    });
    message.edit({ embeds: [new EmbedBuilder().setTitle("Success").setDescription("Maps have been downloaded, setting up embed.").setColor("Green")] });
  }

  return mapsInBulk.reduce((acc: any, { id, data }: { id: number; data: string }) => {
    acc[id] = data;
    return acc;
  }, {});
}

// const userDetails = getUser({ user, mode });
