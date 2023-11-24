import { Message, ChatInputCommandInteraction } from "discord.js";
import { MyClient } from "../classes";
import { osuModes } from "../types";
import { getUser } from "../functions";
import { Interactionhandler, getUsernameFromArgs } from "../utils";
import { v2 } from "osu-api-extended";

export async function start({ interaction, args, mode, client }: { interaction: Message | ChatInputCommandInteraction; args?: string[]; mode?: osuModes; client: MyClient }) {
  const interactionOptions = Interactionhandler(interaction, args);
  const { reply, author, userArgs } = interactionOptions;
  mode = (mode ?? interactionOptions.mode) as osuModes;

  const options = getUsernameFromArgs(author, userArgs);
  if (!options || options.user?.status) {
    return reply(options?.user.message ?? "Something went wrong.");
  }

  const user = await v2.user.details(options.user, interactionOptions.mode);
  if (!user.id) {
    return reply(`The user \`${options.user}\` does not exist in Bancho.`);
  }

  let plays = await v2.scores.user.category(user.id, "best", {
    limit: "100",
    mode,
  });
  plays = options.flags.rev ? plays.sort((a, b) => Number(a.pp) - Number(b.pp)) : plays;
}

// const userDetails = getUser({ user, mode });
