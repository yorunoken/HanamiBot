import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("osu")
    .setDescription("Displays a user's osu! stats specified by mode")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)").setRequired(false))
    .addStringOption((option) => option
        .setName("mode")
        .setDescription("Select an osu! mode")
        .setRequired(false)
        .addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "catch", value: "fruits" }));
