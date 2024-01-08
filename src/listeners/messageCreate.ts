import { cryptr } from "..";
import { ActionRow, Button } from "@lilybird/jsx";
import { ButtonStyle, EmbedType } from "lilybird";
import type { Client, Message } from "lilybird";
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
        children: [
            { data: { name: "disordId", value: discordId }, type: "field" },
            { data: { name: "osuId", value: osuId }, type: "field" }
        ]
    };

    const verifyButton = ActionRow({ children: Button({ id: "verify", label: "Confirm", style: ButtonStyle.Primary }) });

    await client.rest.createMessage(memberDm.id, { embeds: [embed], components: [verifyButton] });
}

async function run(message: Message): Promise<void> {
    const { client } = message;

    if (message.channelId === "1193529619907891331") {
        await verifyUser(client, message);
        return;
    }
}

export default {
    event: "messageCreate",
    run
} satisfies Event<"messageCreate">;
