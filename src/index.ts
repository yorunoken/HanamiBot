import { auth } from "osu-api-extended";
import { createHandler } from "@lilybird/handlers/simple";
import { CachingDelegationType, createClient, Intents } from "lilybird";
import { Channel, Guild, GuildVoiceChannel } from "@lilybird/transformers";

// Log in to osu!
// This method will automatically refresh the token.
await auth.login({
    type: "v2",
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scopes: ["public"],
});

// Handle out-of-scope errors.
// TODO: send the error through a Discord webhook using process.env.ERROR_CHANNEL_WEBHOOK.
process.on("unhandledRejection", async (error: Error) => {
    console.error("An unhandled rejection was detected:", error);
});

process.on("uncaughtException", async (error: Error) => {
    console.error("An uncaught exception was detected:", error);
});

const listeners = await createHandler({
    dirs: {
        listeners: `${import.meta.dir}/listeners`,
    },
});

await createClient({
    token: process.env.DISCORD_BOT_TOKEN,
    caching: {
        transformerTypes: { channel: Channel, guild: Guild, voiceState: GuildVoiceChannel },
        delegate: CachingDelegationType.DEFAULT,
        applyTransformers: true,
        enabled: { channel: true },
    },
    intents: [Intents.GUILDS, Intents.GUILD_MESSAGES, Intents.MESSAGE_CONTENT, Intents.GUILD_MEMBERS],
    ...listeners,
});
