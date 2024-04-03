import { getUser, insertData } from "@utils/database";
import { ScoreEmbed } from "@type/database";
import { ApplicationCommandOptionType } from "lilybird";
import type { ApplicationCommandData, GuildInteraction, Interaction } from "@lilybird/transformers";
import type { EmbedStructure } from "lilybird";
import type { SlashCommand } from "@lilybird/handlers";

export default {
    post: "GLOBAL",
    data: {
        name: "config",
        description: "Set your account configurations",
        options: [
            {
                type: ApplicationCommandOptionType.NUMBER,
                name: "score_embeds",
                description: "Specify what size score embeds should be. (compare, recent...)",
                choices: [ { name: "Maximized", value: 1 }, { name: "Minimized", value: 0 } ],
                required: false
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "mode",
                description: "Specify an osu! mode (none defaults to osu)",
                choices: [ { name: "None", value: "osu" }, { name: "osu", value: "osu" }, { name: "mania", value: "mania" }, { name: "taiko", value: "taiko" }, { name: "ctb", value: "fruits" } ],
                required: false
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: "embed_type",
                description: "Specify an osu! embed type. Default: Hanami",
                choices: [ { name: "Bathbot", value: "bathbot" }, { name: "owo", value: "owobot" }, { name: "Hanami", value: "hanami" } ],
                required: false
            }
        ]
    },
    run
} satisfies SlashCommand;

async function run(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply();
    if (!interaction.inGuild()) return;

    const { member } = interaction;
    const scoreEmbedData = interaction.data.getNumber("score_embeds");
    const modeData = interaction.data.getString("mode");
    const embedTypeData = interaction.data.getString("embed_type");

    if (typeof modeData === "undefined" && typeof scoreEmbedData === "undefined" && typeof embedTypeData === "undefined") {
        await list(interaction);
        return;
    }

    const changes = [];
    if (typeof modeData !== "undefined") {
        mode(member.user.id, modeData);
        changes.push({ type: "mode", data: modeData });
    }

    if (typeof scoreEmbedData !== "undefined") {
        scoreEmbed(member.user.id, scoreEmbedData);
        changes.push({ type: "mode", data: ScoreEmbed[scoreEmbedData] });
    }

    if (typeof embedTypeData !== "undefined") {
        embedType(member.user.id, embedTypeData);
        changes.push({ type: "mode", data: embedTypeData });
    }

    let changesText = "";
    for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        changesText += `${change.type}: ${change.data}\n`;
    }

    await interaction.editReply({
        embeds: [
            {
                title: `Successfully changes configs for ${interaction.member.user.username}`,
                description: `Changed configs:\n${changesText}`
            }
        ]
    });
}

async function list(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    const defaults: Record<string, string> = {
        score_embeds: "Maximized",
        mode: "None",
        unknown: "unknown"
    };

    const userId = interaction.member.user.id;
    let user = getUser(userId);
    if (!user) {
        insertData({ table: "users", id: userId, data: [ { name: "banchoId", value: null } ] });
        user = { banchoId: null, mode: null, score_embeds: null, embed_type: null, id: userId };
    }
    const embeds: EmbedStructure = { fields: [], title: `Config settings of ${interaction.member.user.username}` };

    for (const [key, v] of Object.entries(user)) {
        const value = v as string | number | null;
        if (key === "id" || key === "banchoId") continue;

        if (value !== null)
            embeds.fields?.push({ name: key, value: typeof value === "number" ? ScoreEmbed[value] : value });
        else
            embeds.fields?.push({ name: key, value: defaults[key || "unknown"] });
    }

    await interaction.editReply({ embeds: [embeds] });
}

function mode(memberId: string, choice: string): void {
    insertData({ table: "users", id: memberId, data: [ { name: "mode", value: choice } ] });
}

function scoreEmbed(memberId: string, choice: number): void {
    insertData({ table: "users", id: memberId, data: [ { name: "score_embeds", value: choice } ] });
}

function embedType(memberId: string, choice: string): void {
    insertData({ table: "users", id: memberId, data: [ { name: "embed_type", value: choice } ] });
}
