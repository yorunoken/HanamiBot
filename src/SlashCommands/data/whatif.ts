import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("whatif")
    .setDescription("Calculates the impact of X pp in a user's tops")
    .addNumberOption((option) => option.setName("pp").setDescription("Specify a pp amount to be added to your tops").setMinValue(1).setRequired(true))
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)"))
    .addNumberOption((option) => option.setName("count").setDescription("Specify how many times the score should be proccessed, defaults to 1").setMinValue(1).setMaxValue(100))
    .addStringOption((option) => option
        .setName("mode")
        .setDescription("Select an osu! mode")
        .addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "catch", value: "fruits" }));
