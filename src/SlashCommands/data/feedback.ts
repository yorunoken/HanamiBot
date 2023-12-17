import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Give feedback about the bot")
    .addStringOption((o) => o.setName("feedback").setDescription("Type your feedback/bug report here!.").setRequired(true))
    .addStringOption((o) => o
        .setName("type")
        .setDescription("the type of feedback")
        .addChoices({ name: "feedback", value: "feedback" }, { name: "bug report", value: "report" }, { name: "feature request", value: "request" })
        .setRequired(true));
