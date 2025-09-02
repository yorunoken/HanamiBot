import { avatarBuilder } from "@builders";
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

    const embeds = await getEmbeds(user, message.author.id);
    await channel.send({ embeds });
}

export async function runApplication({ interaction }: ApplicationCommand) {
    await interaction.deferReply();

    const { user } = getCommandArgs(interaction);
    if (user.type === UserType.FAIL) {
        await interaction.editReply(user.failMessage);
        return;
    }

    const embeds = await getEmbeds(user, interaction.member.user.id);
    await interaction.editReply({ embeds });
}

async function getEmbeds(user: SuccessUser, authorId: string) {
    const osuUserRequest = await client.safeParse(client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } }));
    if (!osuUserRequest.success) {
        return [
            {
                type: EmbedType.Rich,
                title: "Uh oh! :x:",
                description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :(`,
            },
        ];
    }
    const osuUser = osuUserRequest.data;

    const embeds = avatarBuilder({
        type: EmbedBuilderType.AVATAR,
        initiatorId: authorId,
        user: osuUser,
    });

    return embeds;
}

export const data = {
    name: "avatar",
    description: "Display the profile of a user.",
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
