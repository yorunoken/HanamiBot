import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { v2 } from "osu-api-extended";
import { getUser } from "../functions";
import { ExtendedClient, Locales, osuModes, UserInfo } from "../Structure/index";
import { getUsernameFromArgs, Interactionhandler, rulesets } from "../utils";

export async function start({ interaction, client, locale }: { interaction: Message | ChatInputCommandInteraction; client: ExtendedClient; locale: Locales }) {
  const options = Interactionhandler(interaction);
  const { reply, mode, ppValue, ppCount } = options;

  const userOptions = getUsernameFromArgs(options.author, options.userArgs);
  if (!userOptions) {
    return reply(locale.fails.error);
  }
  if (userOptions.user?.status === false) {
    return reply(userOptions.user.message);
  }

  const user = await v2.user.details(userOptions.user, mode);
  if (!user.id) {
    return reply(locale.fails.userDoesntExist.replace("{USER}", userOptions.user));
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

  await reply({ embeds: [await getEmbed(user.statistics.global_rank, getUser({ user, mode, locale }), newPlays, ppValue, ppCount, newPlaysPp, oldPlaysPp + bonus, mode, locale)] });
}

async function getEmbed(globalRank: number, user: UserInfo, newPlays: number[], ppValue: number, ppCount: number, newPp: number, oldPp: number, mode: osuModes, locale: Locales) {
  const embed = new EmbedBuilder().setTitle(locale.embeds.whatif.title.replace("{PP}", ppValue.toFixed(2)).replace("{PLURAL}", ppCount === 1 ? "" : locale.embeds.whatif.plural).replace("{USERNAME}", user.username).replace("{COUNT}", ppCount === 1 ? locale.embeds.whatif.count : ppCount.toString())).setColor("Purple")
    .setAuthor({
      name: `${user.username} ${user.pp}pp (#${user.globalRank} ${user.countryCode}#${user.countryRank})`,
      iconURL: user.userAvatar,
      url: user.userUrl,
    });

  if (newPp === oldPp) {
    return embed.setDescription(locale.embeds.whatif.samePp.replace("{PP}", ppValue.toFixed(2)).replace("{USERNAME}", user.username));
  }

  const data: any = await fetch(`https://osudaily.net/api/pp.php?k=${Bun.env.OSU_DAILY_API}&m=${rulesets[mode]}&t=pp&v=${newPp}`).then(res => res.json());
  const differenceOfPp = newPp - oldPp;
  return embed
    .setDescription(
      locale.embeds.whatif.description
        .replace("{COUNT}", ppCount === 1 ? locale.embeds.whatif.count : ppCount.toString())
        .replace("{PP}", ppValue.toFixed(2))
        .replace("{PLURAL}", ppCount === 1 ? "" : locale.embeds.whatif.plural)
        .replace("{USERNAME}", user.username)
        .replace("{POSITION}", (newPlays.indexOf(ppValue) + 1).toString())
        .replace("{NEWPP}", newPp.toFixed(2).toLocaleString())
        .replace("{DIFFPP}", `${differenceOfPp > 0 ? "+" : ""}${differenceOfPp.toLocaleString()}pp`)
        .replace("{RANK}", data.rank.toLocaleString())
        .replace("{RANKDIFF}", (globalRank - data.rank).toLocaleString()),
    );
}
