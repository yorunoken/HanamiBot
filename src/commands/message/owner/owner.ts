import { query } from "@utils/database";
import { logger } from "@utils/logger";
import type { GuildTextChannel, Message } from "@lilybird/transformers";
import type { MessageCommand } from "@type/commands";

export default {
    name: "owner",
    description: "Owner commands.",
    details: "no you don't.",
    usage: "haha no",
    cooldown: 1000,
    run,
} satisfies MessageCommand;

async function run({ message, args, channel }: { message: Message; args: Array<string>; channel: GuildTextChannel }): Promise<void> {
    if (message.author.id !== process.env.OWNER_ID) {
        await channel.send("secert!!!!!");
        return;
    }

    const str = args.join(" ");
    const queryResponse = query(str);

    try {
        const response = JSON.stringify(queryResponse, null, 2);
        if (response.length > 1500) {
            const blob = new Blob([response], { type: "application/json" });

            await channel.send({
                content: "*Text was too large to send*\n*Here is the file instead:*",
                files: [{ file: blob as File, name: "sqlite_report.json" }],
            });
        } else {
            await channel.send(`SQL result:\n\`\`\`json
${response}
\`\`\``);
        }
    } catch (e) {
        logger.error("SQL query error", e as Error);
        await channel.send("*No response was given*");
    }
}
