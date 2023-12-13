import type { ExtendedClient } from ".";
import type { ClientEvents } from "discord.js";

export default abstract class BaseEvent {
    protected readonly client: ExtendedClient;
    protected constructor(client: ExtendedClient) {
        this.client = client;
    }

    protected abstract execute(...args: ClientEvents[keyof ClientEvents]): void | Promise<void>;
}
