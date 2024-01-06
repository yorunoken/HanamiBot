import express from "express";
import type { Express, Request, Response } from "express";

export class Server {
    private readonly app: Express;
    private readonly apiUrl: string;

    public constructor() {
        this.app = express();
        this.apiUrl = "https://osu.ppy.sh/api/v2";
    }

    private async checkUser(code: string): Promise<void> {
        const clientId = process.env.CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET;
        const requestBody = `client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=https://localhost:8000/auth/osu/cb`;
        const data = await fetch(`https://osu.ppy.sh/oauth/token?${requestBody}`);
        console.log(data);
    }

    public start(): void {
        this.app.get("/auth/osu/cb", async (req: Request, res: Response) => {
            const { code: osuSession, state: discordId } = req.query;
            console.log(osuSession, discordId);
            if (typeof osuSession !== "string" || typeof discordId !== "string") return;

            await this.checkUser(osuSession);
            res.send("Success!");
        });

        const host = "localhost";
        const port = Number(process.env.PORT ?? 8000);
        this.app.listen(port, host);
        console.log(`Basic server listening on http://${host}:${port}`);
    }
}
