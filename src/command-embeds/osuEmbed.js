const { EmbedBuilder } = require("discord.js");

const grades = {
  A: "<:A_:1057763284327080036>",
  S: "<:S_:1057763291998474283>",
  SH: "<:SH_:1057763293491642568>",
  X: "<:X_:1057763294707974215>",
  XH: "<:XH_:1057763296717045891>",
};

const options = {
  hour: "2-digit",
  minute: "2-digit",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
};

function buildPage1(user, mode) {
  const globalRank = user.statistics.global_rank?.toLocaleString() || "-";
  const countryRank = user.statistics.country_rank?.toLocaleString() || "-";
  const pp = user.statistics.pp.toLocaleString();

  const acc = user.statistics.hit_accuracy.toFixed(2);
  const lvl = user.statistics.level.progress;
  const lvlProgress = lvl.toString(10).padStart(2, "0");
  const playCount = user.statistics.play_count.toLocaleString();
  const playHours = user.statistics.play_time.toFixed(4) / 3600;
  const followers = user.follower_count.toLocaleString();
  const maxCombo = user.statistics.maximum_combo.toLocaleString();

  //ranks
  const ssh = user.statistics.grade_counts.ssh.toLocaleString();
  const ss = user.statistics.grade_counts.ss.toLocaleString();
  const sh = user.statistics.grade_counts.sh.toLocaleString();
  const s = user.statistics.grade_counts.s.toLocaleString();
  const a = user.statistics.grade_counts.a.toLocaleString();

  //convert the time difference to months
  const date = new Date(user.join_date);
  const months = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24 * 30));
  const userJoinedAgo = (months / 12).toFixed(1);

  const formattedDate = date.toLocaleDateString("en-US", options);

  //time get
  let time;
  try {
    time = `**Peak Rank:** \`#${user.rank_highest.rank.toLocaleString()}\` **Achieved:** <t:${new Date(user.rank_highest.updated_at).getTime() / 1000}:R>\n`;
  } catch (err) {
    time = "";
  }

  //embed
  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `${user.username}: ${pp}pp (#${globalRank} ${user.country.code}#${countryRank})`,
      iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
      url: `https://osu.ppy.sh/users/${user.id}/${mode}`,
    })
    .setThumbnail(user.avatar_url)
    .setFields(
      {
        name: "Statistics",
        value: `**Accuracy:** \`${acc}%\` •  **Level:** \`${user.statistics.level.current}.${lvlProgress}\`\n${time}**Playcount:** \`${playCount}\` (\`${playHours.toFixed()} hrs\`)\n**Followers:** \`${followers}\` • **Max Combo:** \`${maxCombo}\``,
      },
      {
        name: "Grades",
        value: `${grades.XH}\`${ssh}\`${grades.X}\`${ss}\`${grades.SH}\`${sh}\`${grades.S}\`${s}\`${grades.A}\`${a}\``,
      }
    )
    .setImage(user.cover_url)
    .setFooter({
      text: `Joined osu! ${formattedDate} (${userJoinedAgo} years ago)`,
    });

  return embed;
}

function buildPage2(user, mode) {
  const globalRank = user.statistics.global_rank?.toLocaleString() || "-";
  const countryRank = user.statistics.country_rank?.toLocaleString() || "-";
  const pp = user.statistics.pp.toLocaleString();

  const division = user.statistics.pp / (user.statistics.play_time / 3600);
  const ppPerHour = division;

  // score
  const rankedScore = user.statistics.ranked_score;
  const totalScore = user.statistics.total_score;
  const objectsHit = user.statistics.total_hits;

  // profile
  const occupation = `**Occupation:**\n \`${user.occupation}\`\n` ?? "";
  const interest = `**Interests:**\n \`${user.interests}\`\n` ?? "";
  const location = `**Location:**\n \`${user.location}\`` ?? "";

  //convert the time difference to months
  const date = new Date(user.join_date);
  const months = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24 * 30));
  const userJoinedAgo = (months / 12).toFixed(1);
  const formattedDate = date.toLocaleDateString("en-US", options);

  //embed
  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: `${user.username}: ${pp}pp (#${globalRank} ${user.country.code}#${countryRank})`,
      iconURL: `https://osu.ppy.sh/images/flags/${user.country_code}.png`,
      url: `https://osu.ppy.sh/users/${user.id}/${mode}`,
    })
    .setThumbnail(user.avatar_url)
    .setFields(
      {
        name: "Score",
        value: `**Ranked Score:** \`${rankedScore.toLocaleString()}\`\n**Total Score:** \`${totalScore.toLocaleString()}\`\n**Objects Hit:** \`${objectsHit.toLocaleString()}\``,
        inline: true,
      },
      { name: "Profile", value: `${occupation}${interest}${location}`, inline: true }
    )
    .setImage(user.cover_url)
    .setFooter({
      text: `Joined osu! ${formattedDate} (${userJoinedAgo} years ago)`,
    });

  return embed;
}

module.exports = { buildPage1, buildPage2 };
