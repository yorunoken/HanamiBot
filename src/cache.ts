export const prefixCache: any = {};
export function updatePrefixCache(object: string[], guildId: string) {
  if (!prefixCache[guildId]) return false;
  prefixCache[guildId] = object;
  return true;
}

export let downloadingMapUserCache: { [username: string]: boolean } = {};
export function updateDownloadingCache(username: string, downloading: boolean) {
  downloadingMapUserCache[username] = downloading;
}
