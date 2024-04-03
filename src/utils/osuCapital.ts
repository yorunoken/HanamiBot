import type { OsuCapital } from "@type/osuCapital";

export async function getStockProfile(userId: number): Promise<OsuCapital> {
    return fetch(
        `https://www.osucapital.com/_next/data/V1FBmQoCp07sQI9_ObTj_/stock/${userId}.json`,
        { headers: { Cookie: `userSession=${process.env.OSU_CAPITAL_ACCESS_TOKEN}` } }
    ).then(async (res) => res.json() as Promise<OsuCapital>);
}
