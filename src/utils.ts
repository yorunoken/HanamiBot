import { db } from "./Handlers/ready";

const getUser = (id: string): any => db.prepare("SELECT * FROM users WHERE id = ?").get(id);
const getServer = (id: string): any => db.prepare("SELECT * FROM servers WHERE id = ?").get(id);
const insertData = ({ guildId, userId, data }: { guildId?: string; userId?: string; data: string }): any => db.prepare(`insert or replace into ${guildId ? "servers" : "users"} values (?, ?)`).run(guildId! || userId!, data);

export { getUser, getServer, insertData };
