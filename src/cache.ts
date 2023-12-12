export const prefixCache: Record<string, Array<string>> = {};
export function updatePrefixCache(object: Array<string>, guildId: string): void {
    prefixCache[guildId] = object;
}

export const downloadingMapUserCache: Record<number, boolean> = {};
export function updateDownloadingCache(userId: number, downloading: boolean): void {
    downloadingMapUserCache[userId] = downloading;
    return;
}
