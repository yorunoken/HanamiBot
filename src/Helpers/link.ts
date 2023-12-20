import { getUsernameFromArgs, insertData, interactionhandler } from "../utils";
import { EmbedBuilder } from "discord.js";
import { v2 } from "osu-api-extended";
import type { ChatInputCommandInteraction, Message, User } from "discord.js";
import type { Locales } from "../Structure/index";

export async function start(interaction: ChatInputCommandInteraction | Message, locale: Locales, args?: Array<string>): Promise<void> {
    const { reply, userArgs: username, author } = interactionhandler(interaction, args);

    if (username.length === 0) {
        await reply(locale.embeds.provideUsername);
        return;
    }

    const userOptions = getUsernameFromArgs({} as User, username);
    if (!userOptions) return;
    if (userOptions.user === undefined || typeof userOptions.user === "object") {
        await reply(locale.fails.linkFail);
        return;
    }

    const user = await v2.user.details(userOptions.user, "osu");
    if (!user.id) {
        await reply(locale.fails.userDoesntExist(userOptions.user));
        return;
    }

    insertData({ table: "users", id: author.id, data: [ { name: "banchoId", value: user.id } ] });

    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle(locale.misc.success)
        .setDescription(locale.embeds.link.success(author.id, user.username))
        .setThumbnail(user.avatar_url);
    await reply({ embeds: [embed] });
}
