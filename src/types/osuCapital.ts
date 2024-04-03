export interface CapitalUser {
    session: {
        user_id: number,
        osu_name: string,
        osu_picture: string
    };
    stock: {
        stock_id: number,
        share_price: number,
        shares_owned: number,
        share_rank: number,
        share_price_change_percentage: number,
        osu_name: string,
        osu_picture: string,
        osu_banner: string,
        osu_rank: number,
        osu_pp: number,
        osu_rank_history: Array<number>,
        last_updated: string,
        share_price_history: Array<object>,
        osu_playcount_history: Array<object>,
        osu_join_date: string,
        is_buyable: boolean,
        prevent_trades: null | boolean,
        osu_country_code: string,
        is_sellable: boolean
    };
    recentTrades: Array<object>;
    userTradeHistory: Array<any>;
    heldCoins: number;
    canDoTradingBonus: boolean;
    improvementBonus: number;
}

export interface OsuCapital {
    pageProps: CapitalUser;
}
