import { SlashCommandBuilder } from "discord.js";
export const data = new SlashCommandBuilder()
  .setName("rank")
  .setDescription("Calculates the amount of pp score a user would have to set to get to a certain rank")
  .addNumberOption((option) => option.setName("rank").setDescription("Specify a rank you want the user to reach").setRequired(true))
  .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)"))
  .addStringOption((option) => option.setName("mode").setDescription("Select an osu! mode").addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "catch", value: "fruits" }));
