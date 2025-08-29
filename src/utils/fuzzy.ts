interface SearchResult {
    option: string;
    distance: number;
}

export function fuzzySearch(target: string, options: Array<string>): Array<SearchResult> {
    const results: Array<SearchResult> = [];

    for (const option of options) {
        const distance = levenshteinDistance(target, option);
        results.push({ option, distance });
    }

    results.sort((a, b) => a.distance - b.distance);
    return results;
}

// I think I got the code from some random ahh website lmao
function levenshteinDistance(a: string, b: string): number {
    const dp: Array<Array<number>> = Array.from(Array(a.length + 1), () => Array(b.length + 1).fill(0) as Array<number>);

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;

    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }

    return dp[a.length][b.length];
}
