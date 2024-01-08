import { getUser } from "../utils";
import type { Event } from "@lilybird/handlers";

function createUser(): void {
    console.log("hi");
}

export default {
    event: "messageCreate",
    run: (message) => {
        if (message.channelId !== "1193529619907891331") return;

        const { content } = message;
        if (!content) return;
        const [discordId, osuId] = content.split("\n");
        const user = getUser(discordId);
        if (!user)
            createUser();
        else if (osuId === user.banchoId)
            console.log("hdddi");
    }
} satisfies Event<"messageCreate">;
