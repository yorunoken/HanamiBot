import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("recent")
    .setDescription("Displays a user's recent score")
    .addStringOption((option) => option.setName("user").setDescription("Specify a username. (or tag someone)"))
    .addStringOption((option) => option
        .setName("mode")
        .setDescription("Select an osu! mode")
        .addChoices({ name: "standard", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "catch", value: "fruits" }))
//   .addStringOption((option) => option.setName("mods").setDescription("Specify a mod combination").setRequired(false))
    .addBooleanOption((option) => option.setName("passonly").setDescription("Specify whether only passes should be considered."))
    .addIntegerOption((option) => option.setName("index").setDescription("The index of a recent play.").setMinValue(1).setMaxValue(50));
