import { db } from "./Handlers/ready";
import { response as UserOsu } from "osu-api-extended/dist/types/v2_user_details";
import { User as UserDiscord, Message, ChatInputCommandInteraction, InteractionType } from "discord.js";
import { osuModes } from "./types";

export const getUser = (id: string): any => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
export const getServer = (id: string): any => db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
export const insertData = ({ guildId, userId, data }: { guildId?: string; userId?: string; data: string }): any => db.prepare(`insert or replace into ${guildId ? "servers" : "users"} values (?, ?)`).run(guildId || userId!, data);

export function getUserDetails(user: UserOsu, mode: osuModes) {
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

  return {
    username: user.username,
    userCover: user.cover_url,
    userAvatar: user.avatar_url,
    userUrl: `https://osu.ppy.sh/users/${user.id}/${mode}`,
    userFlag: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
    highestRank: user.rank_highest?.rank.toLocaleString() || undefined,
    highestRankTime: user.rank_highest ? new Date(user.rank_highest.updated_at).getTime() / 1000 : undefined,
    recommendedStarRating: (Math.pow(stats.pp, 0.4) * 0.195).toFixed(2),
    userJoinedAgo: (months / 12).toFixed(1),
    formattedDate: date.toLocaleDateString("en-US", timeOptions),
    globalRank: stats.global_rank?.toLocaleString() || "-",
    countryRank: stats.country_rank?.toLocaleString() || "-",
    pp: stats.pp.toLocaleString(),
    accuracy: stats.hit_accuracy.toFixed(2),
    level: `${user.statistics.level.current}.${stats.level.progress.toString(10).padStart(2, "0")}`,
    playCount: stats.play_count.toLocaleString(),
    playHours: (stats.play_time / 3600).toFixed(0),
    followers: user.follower_count.toLocaleString(),
    maxCombo: stats.maximum_combo.toLocaleString(),
    rankS: stats.grade_counts.s.toLocaleString(),
    rankA: stats.grade_counts.a.toLocaleString(),
    rankSs: stats.grade_counts.ss.toLocaleString(),
    rankSh: stats.grade_counts.sh.toLocaleString(),
    rankSsh: stats.grade_counts.ssh.toLocaleString(),
    emoteA: grades.A,
    emoteS: grades.S,
    emoteSh: grades.SH,
    emoteSs: grades.X,
    emoteSsh: grades.XH,
  };
}

function errMsg(message: string) {
  return { status: false, message };
}

function getUserData(userId: string) {
  return getUser(userId) || errMsg(`The Discord user <@${userId}> hasn't linked their account to the bot yet!`);
}

const flags = ["i", "rev", "p"];
const argParser = (str: string, flags: string[]) => [...str.matchAll(/-(\w+)|(\w+)=(\S+)/g)].filter((m) => flags.includes(m[1]) || flags.includes(m[2])).map((m) => [m[1] || m[2], m[3]]);

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
