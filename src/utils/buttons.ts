import { ComponentType, ButtonStyle } from "lilybird";
import type { MessageComponentStructure } from "lilybird";

export const pageButtonsArgs = {
    buttonCustomIds: ["min-page", "decrement-page", "increment-page", "max-page"],
    buttonLabels: ["<<", "<", ">", ">>"]
};
export const indexButtonsArgs = {
    buttonCustomIds: ["min-index", "decrement-index", "increment-index", "max-index"],
    buttonLabels: ["<<", "<", ">", ">>"]
};

export function createActionRow({
    isPage,
    disabledStates
}: { isPage: boolean, disabledStates: Array<boolean> }): Array<MessageComponentStructure> {
    const { buttonCustomIds, buttonLabels } = isPage ? pageButtonsArgs : indexButtonsArgs;

    const length = Math.max(buttonCustomIds.length, buttonLabels.length);
    const components: Array<MessageComponentStructure> = [];
    for (let i = 0; i < length; i++) {
        if (buttonCustomIds[i] && buttonLabels[i]) {
            components.push({
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                custom_id: buttonCustomIds[i],
                label: buttonLabels[i],
                disabled: disabledStates[i]
            });
        }
    }

    return [
        {
            type: ComponentType.ActionRow,
            components
        }
    ];
}

export function calculateButtonState(isNext: boolean, index: number, total: number): boolean {
    return isNext ? index + 1 === total : index === 0;
}

