import { Message, ChatInputCommandInteraction } from "discord.js";
import { response as User } from "osu-api-extended/dist/types/v2_user_details";
import { userDetails } from "../utils";
import { osuModes } from "../types";

async function start(interaction: Message | ChatInputCommandInteraction) {
  const reply = interaction instanceof Message ? interaction.channel.send : interaction.editReply;
  const user = interaction instanceof Message ? undefined : interaction.options.getString("user");
  const mode = interaction instanceof Message ? undefined : interaction.options.getString("mode");
}

function buildPage1(user: User, mode: osuModes) {
  const options = userDetails(user);
}
