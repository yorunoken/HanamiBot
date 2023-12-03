import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { v2 } from "osu-api-extended";
import { getUser } from "../functions";
import { ExtendedClient, Locales, osuModes, UserInfo } from "../Structure/index";
import { approxMorePp, calculateMissingPp, getUsernameFromArgs, Interactionhandler, rulesets } from "../utils";

export async function start({ interaction, client, locale }: { interaction: Message | ChatInputCommandInteraction; client: ExtendedClient; locale: Locales }) {
  const options = Interactionhandler(interaction);
  const { reply, mode, ppValue } = options;

  const userOptions = getUsernameFromArgs(options.author, options.userArgs);
  if (!userOptions) {
    return reply(locale.fails.error);
  }
  if (userOptions.user?.status === false) {
    return reply(userOptions.user.message);
  }

  const user = await v2.user.details(userOptions.user, mode);
  if (!user.id) {
    return reply(locale.fails.userDoesntExist(userOptions.user));
  }

  const userPp = user.statistics.pp;
  if (userPp >= ppValue) {
    return reply(locale.embeds.pp.ppHigh(user.username));
  }

  const pps = (await v2.scores.user.category(user.id, "best", { limit: "100", mode }))
    .map(play => Number(play.pp));
  approxMorePp(pps);
  const missingPp = calculateMissingPp(userPp, ppValue, pps);

  await reply({ embeds: [await getEmbed(getUser({ user, mode, locale }), missingPp, ppValue, mode, locale)] });
}

async function getEmbed(user: UserInfo, missingPps: number[], ppValue: number, mode: osuModes, locale: Locales) {
  const [targetPp, idx] = missingPps;

  const embed = new EmbedBuilder().setTitle(locale.embeds.pp.playerMissing(user.username, ppValue)).setColor("Purple")
    .setAuthor({
      name: `${user.username} ${user.pp}pp (#${user.globalRank} ${user.countryCode}#${user.countryRank})`,
      iconURL: user.userAvatar,
      url: user.userUrl,
    });

  const data: any = await fetch(`https://osudaily.net/api/pp.php?k=${Bun.env.OSU_DAILY_API}&m=${rulesets[mode]}&t=pp&v=${ppValue}`).then(res => res.json());
  return embed.setDescription(
    locale.embeds.pp.description(user.username, targetPp.toFixed(2), ppValue.toFixed(2), (idx + 1).toString(), data.rank.toLocaleString()),
  );
}
