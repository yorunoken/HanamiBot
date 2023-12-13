export const prefixCache: Record<string, string | undefined> = {};
export function updatePrefixCache(prefix: string, guildId: string): void {
    prefixCache[guildId] = prefix;
}

export const downloadingMapUserCache: Record<number, boolean> = {};
export function updateDownloadingCache(userId: number, downloading: boolean): void {
    downloadingMapUserCache[userId] = downloading;
    return;
}
