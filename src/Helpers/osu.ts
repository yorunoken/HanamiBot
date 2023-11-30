import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { v2 } from "osu-api-extended";
import { MyClient } from "../classes";
import { getUser } from "../functions";
import { commands, UserInfo } from "../Structure";
import { getUsernameFromArgs, Interactionhandler, showMoreButton } from "../utils";

export async function start(interaction: Message | ChatInputCommandInteraction, client: MyClient, args?: string[], mode?: any) {
  const options = Interactionhandler(interaction, args);
  options.mode = mode === "catch" ? "fruits" : mode ?? options.mode;

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

  const userDetailOptions = getUser({ user, mode: options.mode });

  let page = buildPage1(userDetailOptions);
  const response = await options.reply({ embeds: [page], components: [showMoreButton] });
  client.sillyOptions[response.id] = { buttonHandler: "handleProfileButtons", type: commands.Profile, embedOptions: { pageBuilder: [buildPage1, buildPage2], options: userDetailOptions, response }, response, initializer: options.author };
}

function buildPage1(options: UserInfo) {
  const highRank = options.highestRank ? `\n**Peak Rank:** \`#${options.highestRank}\` **Achieved:** <t:${options.highestRankTime}:R>` : "";

  return new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `${options.username}: ${options.pp}pp (#${options.globalRank} ${options.countryCode}#${options.countryRank})`,
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
      },
    )
    .setImage(options.coverUrl)
    .setFooter({
      text: `Joined osu! ${options.formattedDate} (${options.userJoinedAgo} years ago)`,
    });
}

function buildPage2(options: UserInfo) {
  return new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `${options.username}: ${options.pp}pp (#${options.globalRank} ${options.countryCode}#${options.countryRank})`,
      iconURL: options.userFlag,
      url: options.userUrl,
    })
    .setThumbnail(options.userAvatar)
    .setFields(
      {
        name: "Score",
        value: `**Ranked Score:** \`${options.rankedScore}\`\n**Total Score:** \`${options.totalScore}\`\n**Objects Hit:** \`${options.objectsHit}\``,
        inline: true,
      },
      { name: "Profile", value: `${options.occupation}${options.interest}${options.location}`, inline: true },
    )
    .setImage(options.coverUrl)
    .setFooter({
      text: `Joined osu! ${options.formattedDate} (${options.userJoinedAgo} years ago)`,
    });
}
