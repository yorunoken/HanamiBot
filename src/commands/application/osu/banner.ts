import { bannerBuilder } from "@builders";
import { getCommandArgs } from "@utils/args";
import { client } from "@utils/initalize";
import { UserType } from "@type/command-args";
import { EmbedBuilderType } from "@type/builders";
import { ApplicationCommandOptionType, EmbedType } from "lilybird";
import type { ApplicationCommandData, GuildInteraction } from "@lilybird/transformers";
import type { SlashCommand } from "@type/commands";

export default {
    data: {
        name: "banner",
        description: "Display the banner of a user.",
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
    run,
} satisfies SlashCommand;

async function run(interaction: GuildInteraction<ApplicationCommandData>): Promise<void> {
    await interaction.deferReply();

    const { user } = getCommandArgs(interaction);

    if (user.type === UserType.FAIL) {
        await interaction.editReply(user.failMessage);
        return;
    }

    const osuUserRequest = await client.safeParse(client.users.getUser(user.banchoId, { urlParams: { mode: user.mode } }));
    if (!osuUserRequest.success) {
        await interaction.editReply({
            embeds: [
                {
                    type: EmbedType.Rich,
                    title: "Uh oh! :x:",
                    description: `It seems like the user **\`${user.banchoId}\`** doesn't exist! :(`,
                },
            ],
        });
        return;
    }
    const osuUser = osuUserRequest.data;

    const embeds = bannerBuilder({
        type: EmbedBuilderType.BANNER,
        initiatorId: interaction.member.user.id,
        user: osuUser,
        mode: user.mode,
    });

    await interaction.editReply({ embeds });
}
