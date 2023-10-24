import { User as UserDiscord, Message, ChatInputCommandInteraction, InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from "discord.js";
import { response as UserOsu } from "osu-api-extended/dist/types/v2_user_details";
import { osuModes } from "./types";
import { db } from "./Handlers/ready";

const flags = ["i", "rev", "p"];
const argParser = (str: string, flags: string[]) => [...str.matchAll(/-(\w+)|(\w+)=(\S+)/g)].filter((m) => flags.includes(m[1]) || flags.includes(m[2])).map((m) => [m[1] || m[2], m[3]]);

export const loadingButtons = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("wating").setLabel("Waiting..").setStyle(ButtonStyle.Secondary).setDisabled(true));
export const showMoreButton = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("more").setLabel("Show More").setStyle(ButtonStyle.Success));
export const showLessButton = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("less").setLabel("Show Less").setStyle(ButtonStyle.Success));

export const getUser = (id: string): any => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
export const getServer = (id: string): any => db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
export const insertData = ({ guildId, userId, data }: { guildId?: string; userId?: string; data: string }): any => db.prepare(`insert or replace into ${guildId ? "servers" : "users"} values (?, ?)`).run(guildId || userId!, data);

export class UserDetails {
  username: string;
  userCover: string;
  userAvatar: string;
  userUrl: string;
  coverUrl: string;
  userFlag: string;
  countryCode: string;
  highestRank: string | undefined;
  highestRankTime: number | undefined;
  recommendedStarRating: string;
  userJoinedAgo: string;
  formattedDate: string;
  globalRank: string;
  countryRank: string;
  pp: string;
  accuracy: string;
  level: string;
  playCount: string;
  playHours: string;
  followers: string;
  maxCombo: string;
  rankS: string;
  rankA: string;
  rankSs: string;
  rankSh: string;
  rankSsh: string;
  emoteA: string;
  emoteS: string;
  emoteSh: string;
  emoteSs: string;
  emoteSsh: string;
  rankedScore: string;
  totalScore: string;
  objectsHit: string;
  occupation: string;
  interest: string;
  location: string;

  constructor(user: UserOsu, mode: osuModes) {
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    } as any;

    const grades = {
      A: "<:A_:1057763284327080036>",
      S: "<:S_:1057763291998474283>",
      SH: "<:SH_:1057763293491642568>",
      X: "<:X_:1057763294707974215>",
      XH: "<:XH_:1057763296717045891>",
    };

    const stats = user.statistics;
    const date = new Date(user.join_date);
    const months = Math.floor((Date.now() - date.valueOf()) / (1000 * 60 * 60 * 24 * 30));

    this.username = user.username;
    this.userCover = user.cover_url;
    this.userAvatar = user.avatar_url;
    this.userUrl = `https://osu.ppy.sh/users/${user.id}/${mode}`;
    this.coverUrl = user.cover_url;
    this.userFlag = `https://osu.ppy.sh/images/flags/${user.country_code}.png`;
    this.countryCode = user.country.code;
    this.globalRank = stats.global_rank?.toLocaleString() || "-";
    this.countryRank = stats.country_rank?.toLocaleString() || "-";
    this.pp = stats.pp.toLocaleString();
    this.rankedScore = stats.ranked_score.toLocaleString();
    this.totalScore = stats.total_score.toLocaleString();
    this.objectsHit = stats.total_hits.toLocaleString();
    this.occupation = `**Occupation:**\n \`${user.occupation}\`\n` ?? "";
    this.interest = `**Interests:**\n \`${user.interests}\`\n` ?? "";
    this.location = `**Location:**\n \`${user.location}\`` ?? "";
    this.highestRank = user.rank_highest?.rank.toLocaleString() || undefined;
    this.highestRankTime = user.rank_highest ? new Date(user.rank_highest.updated_at).getTime() / 1000 : undefined;
    this.recommendedStarRating = (Math.pow(stats.pp, 0.4) * 0.195).toFixed(2);
    this.userJoinedAgo = (months / 12).toFixed(1);
    this.formattedDate = date.toLocaleDateString("en-US", timeOptions);
    this.accuracy = stats.hit_accuracy.toFixed(2);
    this.level = `${user.statistics.level.current}.${stats.level.progress.toString(10).padStart(2, "0")}`;
    this.playCount = stats.play_count.toLocaleString();
    this.playHours = (stats.play_time / 3600).toFixed(0);
    this.followers = user.follower_count.toLocaleString();
    this.maxCombo = stats.maximum_combo.toLocaleString();
    this.rankS = stats.grade_counts.s.toLocaleString();
    this.rankA = stats.grade_counts.a.toLocaleString();
    this.rankSs = stats.grade_counts.ss.toLocaleString();
    this.rankSh = stats.grade_counts.sh.toLocaleString();
    this.rankSsh = stats.grade_counts.ssh.toLocaleString();
    this.emoteA = grades.A;
    this.emoteS = grades.S;
    this.emoteSh = grades.SH;
    this.emoteSs = grades.X;
    this.emoteSsh = grades.XH;
  }
}

export class ButtonActions {
  static async handleProfileButtons(pageBuilders: any[], i: ButtonInteraction, userDetailOptions: UserDetails, response: Message) {
    const customId = i.customId;
    await i.update({ components: [loadingButtons as any] });
    if (customId === "more") {
      const page = pageBuilders[1](userDetailOptions);
      response.edit({ embeds: [page], components: [showLessButton as any] });
    } else if (customId === "less") {
      const page = pageBuilders[0](userDetailOptions);
      response.edit({ embeds: [page], components: [showMoreButton as any] });
    }
  }
}

function errMsg(message: string) {
  return { status: false, message };
}

function getUserData(userId: string) {
  return getUser(userId) || errMsg(`The Discord user <@${userId}> hasn't linked their account to the bot yet!`);
}

export function getUsernameFromArgs(user: UserDiscord, args?: string[]) {
  args = args || [];

  const flagsParsed = argParser(args.join(" "), flags);

  const argumentString = args.filter((arg) => !flags.includes(arg) || !flags.includes(`-${arg}`)).join("");
  if (!argumentString) {
    return { user: getUserData(user.id), flags: flagsParsed };
  }

  const discordUserRegex = /\d{17,18}/;
  const discordUserMatch = argumentString.match(discordUserRegex);
  const userId = discordUserMatch ? discordUserMatch[0] : undefined;

  const discordUser = userId ? { user: getUserData(userId), flags: flagsParsed } : undefined;
  if (discordUser) {
    return discordUser;
  }

  const osuUsernameRegex = /"(.*?)"/;
  const osuUsernameMatch = argumentString.match(osuUsernameRegex);
  const osuUsername = osuUsernameMatch ? osuUsernameMatch[1] : args[0] || undefined;

  return osuUsername ? { user: osuUsername, flags: flagsParsed } : undefined;
}

export function IntearctionHandler(interaction: Message | ChatInputCommandInteraction, args?: string[]) {
  const isSlash = interaction.type === InteractionType.ApplicationCommand;

  const reply = (options: any) => (isSlash ? interaction.editReply(options) : interaction.channel.send(options));
  const userArgs = isSlash ? [interaction.options.getString("user") || ""] : args;
  const author = isSlash ? interaction.user : interaction.author;
  const mode = isSlash ? (interaction.options.getString("mode") as osuModes) || "osu" : "osu";

  return { reply, userArgs, author, mode };
}
