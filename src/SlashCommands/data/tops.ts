import { SlashCommandBuilder } from "discord.js";
export const data = new SlashCommandBuilder()
  .setName("top")
  .setDescription("Displays a user's top scores")
  .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)"))
  .addStringOption((option) => option.setName("mode").setDescription("Select an osu! mode").addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "catch", value: "fruits" }))
  .addIntegerOption((option) => option.setName("page").setDescription("The page of the top plays.").setMinValue(1).setMaxValue(10))
  .addIntegerOption((option) => option.setName("index").setDescription("The index of the top plays.").setMinValue(1).setMaxValue(100));
