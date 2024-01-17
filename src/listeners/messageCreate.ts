import { cryptr } from "..";
import { ButtonStyle, EmbedType, ComponentType } from "lilybird";
import type { Client, EmbedStructure, Message } from "lilybird";
import type { Event } from "@lilybird/handlers";

async function verifyUser(client: Client, message: Message): Promise<void> {
    const { content } = message;
    if (!content) return;

    const [cryptedDiscordId, osuId] = content.split("\n");
    const discordId = cryptr.decrypt(cryptedDiscordId);

    const memberDm = await client.rest.createDM(discordId);

    const embed = {
        type: EmbedType.Rich,
        title: "Welcome to the osu! verifier!",
        description: "Your Discord account is being linked to an osu! user. Please confirm it by pressing the `confirm` button below.\n\nIf you did not mean for this to happen, you can ignore this message.",
        fields: [
            { name: "disordId", value: discordId },
            { name: "osuId", value: osuId }
        ]

    } as EmbedStructure;

    await client.rest.createMessage(memberDm.id, {
        embeds: [embed],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [ { style: ButtonStyle.Primary, custom_id: "verify", label: "Confirm", type: ComponentType.Button } ]
            }
        ]
    });
}

async function run(message: Message): Promise<void> {
    if (message.channelId === "1193529619907891331")
        await verifyUser(message.client, message);

    return;
}

export default {
    event: "messageCreate",
    run
} satisfies Event<"messageCreate">;
