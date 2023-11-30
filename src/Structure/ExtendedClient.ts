import { Client, Collection } from "discord.js";
import { commandInterface } from "./types";

export default class extends Client {
  [x: string]: any;
  slashCommands: Collection<any, any>;
  prefixCommands: Collection<any, any>;
  aliases: Collection<any, any>;
  sillyOptions: Record<string, commandInterface>;
  client: any;

  constructor(options: any) {
    super(options);
    this.slashCommands = new Collection();
    this.prefixCommands = new Collection();
    this.aliases = new Collection();
    this.sillyOptions = {};
  }
}
