export const prefixCache: any = {};
export function updatePrefixCache(object: string[], guildId: string) {
  if (!prefixCache[guildId]) return false;
  prefixCache[guildId] = object;
  return true;
}

export let downloadingMapUserCache: { [userId: number]: boolean } = {};
export function updateDownloadingCache(userId: number, downloading: boolean) {
  downloadingMapUserCache[userId] = downloading;
}
