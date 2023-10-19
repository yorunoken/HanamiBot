import { Message } from "discord.js";

export async function run({ message }: { message: Message }) {
  const timeNow = Date.now();
  const response = await message.reply(`Pong! 🏓`);
  const ms = Date.now() - timeNow;
  response.edit(`Pong! 🏓(${ms}ms)`);
}
export * from "../data/ping";
