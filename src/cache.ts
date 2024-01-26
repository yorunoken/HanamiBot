export const prefixesCache = new Map<string, Array<string>>();
export function updatePrefixCache(key: string, value: Array<string>): void {
    prefixesCache.set(key, value);
}
