import { User as UserDiscord, Message, ChatInputCommandInteraction, InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { db } from "./Handlers/ready";
import { osuModes } from "./types";

export const grades: { [key: string]: string } = {
  A: "<:A_:1057763284327080036>",
  B: "<:B_:1057763286097076405>",
  C: "<:C_:1057763287565086790>",
  D: "<:D_:1057763289121173554>",
  F: "<:F_:1057763290484318360>",
  S: "<:S_:1057763291998474283>",
  SH: "<:SH_:1057763293491642568>",
  X: "<:X_:1057763294707974215>",
  XH: "<:XH_:1057763296717045891>",
};

export const rulesets: { [key: string]: number } = {
  osu: 0,
  taiko: 1,
  fruits: 2,
  mania: 3,
};

export const buildActionRow = (buttons: ButtonBuilder[], disabledStates: boolean[] = []) => {
  const actionRow = new ActionRowBuilder();
  buttons.forEach((button, index) => {
    const isButtonDisabled = disabledStates[index] === true;
    actionRow.addComponents(isButtonDisabled ? button.setDisabled(true) : button.setDisabled(false));
  });
  return actionRow;
};

export function getRetryCount(retryMap: any[], mapId: number) {
  let retryCounter = 0;
  for (let i = 0; i < retryMap.length; i++) {
    if (retryMap[i] === mapId) {
      retryCounter++;
    }
  }
  return retryCounter;
}

export const formatNumber = (value: number, decimalPlaces: number) => value.toFixed(decimalPlaces).replace(/\.0+$/, "");
export const errMsg = (message: string) => ({ status: false, message });
export const getUserData = (userId: string) => getUser(userId) || errMsg(`The Discord user <@${userId}> hasn't linked their account to the bot yet!`);

const flags = ["i", "rev", "p"];
export const argParser = (str: string, flags: string[]) => [...str.matchAll(/-(\w+)|(\w+)=(\S+)/g)].filter((m) => flags.includes(m[1]) || flags.includes(m[2])).map((m) => [m[1] || m[2], m[3]]);

export const loadingButtons = buildActionRow([new ButtonBuilder().setCustomId("wating").setLabel("Waiting..").setStyle(ButtonStyle.Secondary)], [false]);
export const showMoreButton = buildActionRow([new ButtonBuilder().setCustomId("more").setLabel("Show More").setStyle(ButtonStyle.Success)]);
export const showLessButton = buildActionRow([new ButtonBuilder().setCustomId("less").setLabel("Show Less").setStyle(ButtonStyle.Success)]);

export const previousButton = new ButtonBuilder().setCustomId("previous").setLabel("⬅️").setStyle(ButtonStyle.Secondary);
export const nextButton = new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary);

export const getUser = (id: string): any => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
export const getServer = (id: string): any => db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
export const getMap = (id: string): any => db.prepare(`SELECT * FROM maps WHERE id = ?`).get(id);
export const insertData = ({ table, id, data }: { table: string; id: string; data: string }): any => db.prepare(`INSERT OR REPLACE INTO ${table} values (?, ?)`).run(id, data);

export function getUsernameFromArgs(user: UserDiscord, args?: string[]) {
  args = args || [];

  const flagsParsed = argParser(args.join(" "), flags);

  const argumentString = args.filter((arg) => !flags.includes(arg) || !flags.includes(`-${arg}`)).join(" ");
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
  const passOnly = isSlash ? interaction.options.getBoolean("passonly") || false : false;

  return { reply, userArgs, author, mode, passOnly };
}
