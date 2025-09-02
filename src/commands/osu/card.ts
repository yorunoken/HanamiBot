import { cardBuilder } from "@builders";
import { MessageReplyOptions } from "@lilybird/transformers";
import { EmbedBuilderType } from "@type/builders";
import { SuccessUser, UserType } from "@type/command-args";
import { CommandData, MessageCommand, ApplicationCommand } from "@type/commands";
import { Mode } from "@type/osu";
import { getCommandArgs, parseOsuArguments } from "@utils/args";
import { client } from "@utils/initalize";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";

export async function runMessage({ message, args, channel }: MessageCommand) {
    const { user } = parseOsuArguments(message, args, Mode.OSU);
    if (user.type === UserType.FAIL) {
        await channel.send(user.failMessage);
        return;
    }

    const reply = await getEmbeds(user, message.author.id);
    await channel.send(reply);
}

export async function runApplication({ interaction }: ApplicationCommand) {
    await interaction.deferReply();

    const { user } = getCommandArgs(interaction);
    if (user.type === UserType.FAIL) {
        await interaction.editReply(user.failMessage);
        return;
    }

    const reply = await getEmbeds(user, interaction.member.user.id);
    await interaction.editReply(reply);
}

async function getEmbeds(user: SuccessUser, authorId: string): Promise<MessageReplyOptions> {
    const osuUserRequest = await client.safeParse(client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } }));
    if (!osuUserRequest.success) {
        return {
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :(`,
                },
            ],
        };
    }
    const osuUser = osuUserRequest.data;

    const reply = await cardBuilder({
        type: EmbedBuilderType.CARD,
        initiatorId: authorId,
        user: osuUser,
    });

    return reply;
}

export const data = {
    name: "banner",
    description: "Display the banner of a user.",
    hasPrefixVariant: true,
    application: {
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "username",
                description: "Specify an osu! username",
            },
            {
                type: ApplicationCommandOptionType.USER,
                name: "discord",
                description: "Specify a linked Discord user",
            },
        ],
    },
} satisfies CommandData;
