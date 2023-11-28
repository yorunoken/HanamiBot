import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { v2 } from "osu-api-extended";
import { MyClient } from "../classes";
import { getUser } from "../functions";
import { osuModes, UserInfo } from "../types";
import { getUsernameFromArgs, Interactionhandler, rulesets } from "../utils";

export async function start({ interaction, client }: { interaction: Message | ChatInputCommandInteraction; client: MyClient }) {
  const options = Interactionhandler(interaction);
  const { reply, mode, ppValue, ppCount } = options;

  const userOptions = getUsernameFromArgs(options.author, options.userArgs);
  if (!userOptions) {
    return reply("Something went wrong.");
  }
  if (userOptions.user?.status === false) {
    return reply(userOptions.user.message);
  }

  const user = await v2.user.details(userOptions.user, mode);
  if (!user.id) {
    return reply(`The user \`${userOptions.user}\` does not exist in Bancho.`);
  }

  const calculateWeightedPp = (plays: number[]) => plays.map((pp, index) => pp * Math.pow(0.95, index)).reduce((a, b) => a + b);

  const limit = 100;
  const oldPlays = (await v2.scores.user.category(user.id, "best", { limit: limit.toString(), mode }))
    .map(play => Number(play.pp));
  const newPlays = oldPlays
    .concat(...Array(ppCount).fill(ppValue))
    .sort((a, b) => b - a)
    .slice(0, limit);

  const oldPlaysPp = calculateWeightedPp(oldPlays);
  const bonus = user.statistics.pp - oldPlaysPp;
  const newPlaysPp = calculateWeightedPp(newPlays) + bonus;

  await reply({ embeds: [await getEmbed(user.statistics.global_rank, getUser({ user, mode }), newPlays, ppValue, ppCount, newPlaysPp, oldPlaysPp + bonus, mode)] });
}

async function getEmbed(globalRank: number, user: UserInfo, newPlays: number[], ppValue: number, ppCount: number, newPp: number, oldPp: number, mode: osuModes) {
  const embed = new EmbedBuilder().setTitle(`${user.username} gets ${ppCount === 1 ? "a" : ppCount} ${ppValue}pp play.`).setColor("Purple")
    .setAuthor({
      name: `${user.username} ${user.pp}pp (#${user.globalRank} ${user.countryCode}#${user.countryRank})`,
      iconURL: user.userAvatar,
      url: user.userUrl,
    });

  if (newPp === oldPp) {
    return embed.setDescription(`A ${ppValue.toFixed(2)}pp play would not be in ${user.username}'s top 100 plays, so their rank and pp remains unchanged.`);
  }

  const data = await fetch(`https://osudaily.net/api/pp.php?k=${Bun.env.OSU_DAILY_API}&m=${rulesets[mode]}&t=pp&v=${newPp}`).then(res => res.json()) as any;
  const playPosition = newPlays.indexOf(ppValue) + 1;
  const differenceOfPp = newPp - oldPp;
  return new EmbedBuilder().setTitle(`${user.username} gets ${ppCount === 1 ? "a" : ppCount} new ${ppValue}pp play${ppCount === 1 ? "" : "s"}.`).setColor("Purple")
    .setAuthor({
      name: `${user.username} ${user.pp}pp (#${user.globalRank} ${user.countryCode}#${user.countryRank})`,
      iconURL: user.userAvatar,
      url: user.userUrl,
    }).setDescription(
      `${ppCount === 1 ? "A" : `${ppCount} of`} **${ppValue.toFixed(2)}pp** play${ppCount === 1 ? "" : "s"} would be ${user.username}'s **#${playPosition}** top play.\nIt would increase their total pp to **${newPp.toFixed(2).toLocaleString()}**, and by **${differenceOfPp > 0 ? "+" : ""}${differenceOfPp.toLocaleString()}pp** and increase their rank to **#${data.rank.toLocaleString()}** (+${
        (globalRank - data.rank).toLocaleString()
      }).`,
    );
}
