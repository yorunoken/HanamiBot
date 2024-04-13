import { getUsers, insertData } from "./database";
import { tursoClient as client } from "./initalize";

export async function syncUsersWithLocal(): Promise<void> {
    const usersOnline = (await getUsersOnline()).sort((a, b) => Number(a?.id) - Number(b?.id));
    const usersLocalMap = new Map(getUsers().map((user) => [user?.id, user]));

    const max = Math.max(usersOnline.length, usersLocalMap.size);
    const maxWhich = usersOnline.length > usersLocalMap.size ? "online" : "local";

    for (let i = 0; i < max; i++) {
        if (maxWhich === "local" && i >= usersLocalMap.size) continue;

        const online = usersOnline[i];
        if (!online) continue;

        const localUser = usersLocalMap.get(online.id);
        if (!localUser) {
            insertData({ table: "users", id: online.id, data: [ { name: "banchoId", value: online.banchoId } ] });
            console.log("Synced:", online);
        }
    }
}

export async function getUsersOnline(): Promise<Array<{ id: string, banchoId: number } | null>> {
    const { rows } = await client.execute("SELECT * FROM users;");

    const response: Array<{ id: string, banchoId: number }> = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        response.push({
            id: typeof row.id === "string" ? row.id.split(".")[0] : "",
            banchoId: typeof row.banchoId === "number" ? row.banchoId : -1
        });
    }

    return response;
}

export async function removeUserOnline(id: string | number): Promise<void> {
    await client.execute({ sql: "DELETE FROM users WHERE id = ?;", args: [id] });
}
