export function getDoubleQuotes(input: string): Array<string> {
    const doubleQuotesMatcher = /"([^"\\]*(\\.[^"\\]*)*)"/gm;
    const matches = input.match(doubleQuotesMatcher) ?? [];

    return matches.map((match) => match.slice(1, -1).replace(/\\(.)/g, "$1"));
}
