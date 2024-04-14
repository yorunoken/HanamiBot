import { getServer, query } from "@utils/database";
import { ApplicationCommandOptionType } from "lilybird";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";
import type { SlashCommand } from "@type/commands";

export default {
    data: {
        name: "owner",
        description: "Owner commands (secret)",
        options: [
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "sql",
                description: "Make a raw SQL query.",
                options: [ { type: ApplicationCommandOptionType.STRING, name: "query", description: "Input your SQL query", required: true } ]
            },
            {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "servers",
                description: "Fetch servers.",
                options: [ { type: ApplicationCommandOptionType.STRING, name: "id", description: "Server ID to fetch.", required: true } ]
            }
        ]
    },
    run
} satisfies SlashCommand;

const commands: Record<string, (interaction: GuildInteraction<ApplicationCommandData>) => Promise<void>> = {
    sql,
    servers
};

async function run(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply(true);
    if (interaction.member.user.id !== process.env.OWNER_ID) {
        await interaction.editReply("secert!!!!!");
        return;
    }

    const { subCommand } = interaction.data;
    if (typeof subCommand === "undefined") {
        await interaction.editReply("oops!");
        return;
    }

    await commands[subCommand](interaction);
}

async function sql(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    const str = interaction.data.getString("query", true);
    const queryResponse = query(str);

    try {
        const response = JSON.stringify(queryResponse, null, 2);
        if (response.length > 1500) {
            const blob = new Blob([response], { type: "application/json" });

            await interaction.editReply({
                content: "*Text was too large to send*\n*Here is the file instead:*",
                files: [ { file: blob, name: "sqlite_report.json" } ]
            });
        } else {
            await interaction.editReply(`SQL result:\n\`\`\`json
${response}
\`\`\``);
        }
    } catch (e) {
        console.log(e);
        await interaction.editReply("*No response was given*");
    }
}

async function servers(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    const id = interaction.data.getString("id", true);
    const guild = getServer(id);
    if (guild === null) {
        await interaction.editReply("Server not found!");
        return;
    }

    try {
        await interaction.editReply(`SQL result:\n\`\`\`json
${JSON.stringify(guild, null, 2)}
\`\`\``);
    } catch (e) {
        await interaction.editReply("*No response was given*");
    }
}
