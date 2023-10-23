import { Message, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { response as User } from "osu-api-extended/dist/types/v2_user_details";
import { getUserDetails, getUsernameFromArgs, IntearctionHandler } from "../utils";
import { osuModes } from "../types";
import { v2 } from "osu-api-extended";

export async function start(interaction: Message | ChatInputCommandInteraction, args?: string[]) {
  const options = IntearctionHandler(interaction, args);

  const userOptions = getUsernameFromArgs(options.author, options.userArgs);
  if (!userOptions) {
    return options.reply("Something went wrong.");
  }
  if (userOptions.user?.status === false) {
    return options.reply(userOptions.user.message);
  }

  const user = await v2.user.details(userOptions.user, options.mode);
  if (!user.id) {
    return options.reply(`The user \`${userOptions.user}\` does not exist in Bancho.`);
  }

  const page1 = buildPage1(user, options.mode);
  await options.reply({ embeds: [page1] });
}

function buildPage1(user: User, mode: osuModes) {
  const options = getUserDetails(user, mode);
  const highRank = options.highestRank ? `\n**Peak Rank:** \`#${options.highestRank}\` **Achieved:** <t:${options.highestRankTime}:R>` : "";

  return new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `${user.username}: ${options.pp}pp (#${options.globalRank} ${user.country.code}#${options.countryRank})`,
      iconURL: options.userFlag,
      url: options.userUrl,
    })
    .setThumbnail(options.userAvatar)
    .setFields(
      {
        name: "Statistics",
        value: `**Accuracy:** \`${options.accuracy}%\` •  **Level:** \`${options.level}\`\n**Playcount:** \`${options.playCount}\` (\`${options.playHours} hrs\`)${highRank}\n**Followers:** \`${options.followers}\` • **Max Combo:** \`${options.maxCombo}\`\n**Recommended Star Rating:** \`${options.recommendedStarRating}★\``,
      },
      {
        name: "Grades",
        value: `${options.emoteSsh}\`${options.rankSsh}\` ${options.emoteSs}\`${options.rankSs}\` ${options.emoteSh}\`${options.rankSh}\` ${options.emoteS}\`${options.rankS}\` ${options.emoteA}\`${options.rankA}\``,
      }
    )
    .setImage(user.cover_url)
    .setFooter({
      text: `Joined osu! ${options.formattedDate} (${options.userJoinedAgo} years ago)`,
    });
}
