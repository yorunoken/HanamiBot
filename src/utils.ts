import { db } from "./Handlers/ready";
//@ts-ignore
import { response as User } from "osu-api-extended/dist/types/v2_user_details";

export const getUser = (id: string): any => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
export const getServer = (id: string): any => db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
export const insertData = ({ guildId, userId, data }: { guildId?: string; userId?: string; data: string }): any => db.prepare(`insert or replace into ${guildId ? "servers" : "users"} values (?, ?)`).run(guildId || userId!, data);

export function userDetails(user: User) {
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  } as any;

  const stats = user.statistics;

  const username = user.username;
  const userCover = user.cover_url;
  const userAvatar = user.avatar_url;

  const globalRank = stats.global_rank.toLocaleString() || "-";
  const countryRank = stats.country_rank.toLocaleString() || "-";
  const highestRank = user.rank_highest.rank.toLocaleString();
  const highestRankTime = new Date(user.rank_highest.updated_at).getTime() / 1000;
  const pp = stats.pp.toLocaleString();

  const recommendedStarRating = user.statistics.pp ** 0.4 * 0.195;
  const date = new Date(user.join_date);
  const months = Math.floor((Date.now() - date.valueOf()) / (1000 * 60 * 60 * 24 * 30));
  const userJoinedAgo = (months / 12).toFixed(1);

  const formattedDate = date.toLocaleDateString("en-US", timeOptions);

  const accuracy = stats.hit_accuracy.toFixed(2);
  const level = user.statistics.level.current;
  const levelProgress = stats.level.progress.toString(10).padStart(2, "0");
  const playCount = stats.play_count.toLocaleString();
  const playHours = (stats.play_time / 3600).toFixed(4);
  const followers = user.follower_count.toLocaleString();
  const maxCombo = stats.maximum_combo.toLocaleString();

  const rankSsh = stats.grade_counts.ssh.toLocaleString();
  const rankSs = stats.grade_counts.ss.toLocaleString();
  const rankSh = stats.grade_counts.sh.toLocaleString();
  const rankS = stats.grade_counts.s.toLocaleString();
  const rankA = stats.grade_counts.a.toLocaleString();

  return {
    username,
    userCover,
    userAvatar,
    highestRank,
    highestRankTime,
    recommendedStarRating,
    userJoinedAgo,
    formattedDate,
    globalRank,
    countryRank,
    pp,
    accuracy,
    level,
    levelProgress,
    playCount,
    playHours,
    followers,
    maxCombo,
    rankS,
    rankA,
    rankSs,
    rankSh,
    rankSsh,
  };
}

type DiscordUser = any
type OsuUser = any
export function getUsernameFromArgs(user: DiscordUser, args: string[]) {
  const argumentString = args.join("")
  const usernameRegex = /"(.*?)"/
  const argument = usernameRegex.test(argumentString) ? usernameRegex.exec(argumentString)![0] : getUser(user.id)
 
  return undefined;
}
