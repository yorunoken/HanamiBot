import { Tables } from "types/database/enums";
import { Commands, DiscordServers, DiscordUsers, Scores, ScoresPP, SlashCommands } from "types/database/interfaces";

export type TableColumnKeys<T extends Tables> = T extends Tables.USERS
    ? keyof DiscordUsers
    : T extends Tables.SERVERS
      ? keyof DiscordServers
      : T extends Tables.COMMANDS
        ? keyof Commands
        : T extends Tables.SLASH_COMMANDS
          ? keyof SlashCommands
          : T extends Tables.SCORES
            ? keyof Scores
            : T extends Tables.SCORES_PP
              ? keyof ScoresPP
              : never;

export type TableEntityType<T extends Tables> = T extends Tables.USERS
    ? DiscordUsers
    : T extends Tables.SERVERS
      ? DiscordServers
      : T extends Tables.COMMANDS
        ? Commands
        : T extends Tables.SLASH_COMMANDS
          ? SlashCommands
          : T extends Tables.SCORES
            ? Scores
            : T extends Tables.SCORES_PP
              ? ScoresPP
              : never;
