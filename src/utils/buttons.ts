import { PaginationManager, ITEMS_PER_PAGE } from "./pagination";
import type { Message } from "lilybird";
import type { EmbedBuilderOptions } from "@type/embedBuilders";

// New simplified exports using PaginationManager
export function createPaginationActionRow(builderOptions: EmbedBuilderOptions): Array<Message.Component.Structure> {
    const totalItems = PaginationManager.getTotalItems(builderOptions);
    const paginationType = PaginationManager.getPaginationType(builderOptions);
    const currentValue = PaginationManager.getCurrentValue(builderOptions, paginationType);

    return PaginationManager.createActionRow({
        type: paginationType,
        totalItems,
        currentValue,
        itemsPerPage: ITEMS_PER_PAGE,
    });
}
