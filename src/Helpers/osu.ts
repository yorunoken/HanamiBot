import { getUser } from "../functions";
import { Commands } from "../Structure/index";
import { getUsernameFromArgs, interactionhandler, showMoreButton } from "../utils";
import { EmbedBuilder } from "discord.js";
import { v2 } from "osu-api-extended";
import type { Locales, UserInfo, ExtendedClient } from "../Structure/index";
import type { ChatInputCommandInteraction, Message } from "discord.js";

export async function start(interaction: Message | ChatInputCommandInteraction, client: ExtendedClient, locale: Locales, args?: Array<string>, mode?: any) {
    const options = interactionhandler(interaction, args);
    options.mode = mode === "catch" ? "fruits" : mode ?? options.mode;

    const userOptions = getUsernameFromArgs(options.author, options.userArgs);
    if (!userOptions)
        return options.reply(locale.fails.error);

    if (userOptions.user?.status === false)
        return options.reply(userOptions.user.message);

    const user = await v2.user.details(userOptions.user, options.mode);
    if (!user.id)
        return options.reply(locale.fails.userDoesntExist(userOptions.user));

    const userDetailOptions = getUser({ user, mode: options.mode, locale });

    const page = buildPage1(userDetailOptions);
    const response = await options.reply({ embeds: [page], components: [showMoreButton] });
    client.sillyOptions[response.id] = {
        buttonHandler: "handleProfileButtons",
        type: Commands.Profile,
        embedOptions:
   {
       pageBuilder: [buildPage1, buildPage2],
       options: userDetailOptions,
       locale,
       response
   },
        response,
        initializer: options.author
    };
}

function buildPage1(options: UserInfo) {
    const { locale } = options;
    const highRank = options.highestRank ? `\n**${locale.embeds.profile.peakRank}:** \`#${options.highestRank}\` **${locale.embeds.profile.achieved}:** <t:${options.highestRankTime}:R>` : "";

    return new EmbedBuilder()
        .setColor("Purple")
        .setAuthor({
            name: `${options.username}: ${options.pp}pp (#${options.globalRank} ${options.countryCode}#${options.countryRank})`,
            iconURL: options.userFlag,
            url: options.userUrl
        })
        .setThumbnail(options.userAvatar)
        .setFields(
            {
                name: locale.embeds.profile.statistics,
                value:
          `**${locale.embeds.profile.accuracy}:** \`${options.accuracy}%\` •  **${locale.embeds.profile.level}:** \`${options.level}\`\n**${locale.embeds.profile.playcount}:** \`${options.playCount}\` (\`${options.playHours} hrs\`)${highRank}\n**${locale.embeds.profile.followers}:** \`${options.followers}\` • **${locale.embeds.profile.maxCombo}:** \`${options.maxCombo}\`\n**${locale.embeds.profile.recommendedStars}:** \`${options.recommendedStarRating}★\``
            },
            {
                name: locale.embeds.profile.grades,
                value: `${options.emoteSsh}\`${options.rankSsh}\` ${options.emoteSs}\`${options.rankSs}\` ${options.emoteSh}\`${options.rankSh}\` ${options.emoteS}\`${options.rankS}\` ${options.emoteA}\`${options.rankA}\``
            }
        )
        .setImage(options.coverUrl)
        .setFooter({
            text: locale.embeds.profile.joinDate(options.formattedDate, options.userJoinedAgo)
        });
}

function buildPage2(options: UserInfo) {
    const { locale } = options;
    return new EmbedBuilder()
        .setColor("Purple")
        .setAuthor({
            name: `${options.username}: ${options.pp}pp (#${options.globalRank} ${options.countryCode}#${options.countryRank})`,
            iconURL: options.userFlag,
            url: options.userUrl
        })
        .setThumbnail(options.userAvatar)
        .setFields(
            {
                name: locale.embeds.profile.score,
                value: `**${locale.embeds.profile.rankedScore}:** \`${options.rankedScore}\`\n**${locale.embeds.profile.totalScore}:** \`${options.totalScore}\`\n**${locale.embeds.profile.objectsHit}:** \`${options.objectsHit}\``,
                inline: true
            },
            { name: locale.embeds.profile.profile, value: `${options.occupation}${options.interest}${options.location}`, inline: true }
        )
        .setImage(options.coverUrl)
        .setFooter({
            text: locale.embeds.profile.joinDate(options.formattedDate, options.userJoinedAgo)
        });
}
