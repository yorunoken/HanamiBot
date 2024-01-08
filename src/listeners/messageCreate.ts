import { cryptr } from "..";
import { ActionRow, Button, Embed } from "@lilybird/jsx";
import { ButtonStyle } from "lilybird";
import type { Client, Message } from "lilybird";
import type { Event } from "@lilybird/handlers";

async function createUser(discordId: string, osuId: string, client: Client): Promise<void> {
    const memberDm = await client.rest.createDM(discordId);

    const embed = Embed({
        title: "Welcome to the osu! verifier!",
        description: "Your Discord account is being linked to an osu! user. Please confirm it by pressing the `confirm` button below.\n\nIf you did not mean for this to happen, you can ignore this message.",
        children: [
            { data: { name: "disordId", value: discordId }, type: "field" },
            { data: { name: "osuId", value: osuId }, type: "field" }
        ]
    });
    const verifyButton = ActionRow({ children: Button({ id: "verify", label: "Confirm", style: ButtonStyle.Primary }) });

    await client.rest.createMessage(memberDm.id, { embeds: [embed], components: [verifyButton] });
}
async function run(message: Message): Promise<void> {
    if (message.channelId !== "1193529619907891331") return;

    const { content, client } = message;
    if (!content) return;

    const [cryptedDiscordId, osuId] = content.split("\n");
    const discordId = cryptr.decrypt(cryptedDiscordId);

    await createUser(discordId, osuId, client);
}

export default {
    event: "messageCreate",
    run
} satisfies Event<"messageCreate">;
