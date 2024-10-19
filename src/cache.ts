// Caching this so I don't have to query the database everytime I need to check if a user initiated a command.
export const serverPrefixesCache = new Map<string, Array<string>>();
