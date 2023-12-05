import { Database } from "bun:sqlite";
import { ExtendedClient } from "../Structure";
import BaseEvent from "../Structure/BaseEvent";

export const db = new Database(`./src/data.db`);
db.run(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data TEXT
);`);
db.run(`CREATE TABLE IF NOT EXISTS servers (
  id INTEGER PRIMARY KEY,
  data TEXT
);`);
db.run(`CREATE TABLE IF NOT EXISTS maps (
  id INTEGER PRIMARY KEY,
  data TEXT
);`);
db.run(`CREATE TABLE IF NOT EXISTS commands (
  name TEXT PRIMARY KEY,
  count INTEGER
);`);
console.log("Database up and running!");

export default class ReadyEvent extends BaseEvent {
  constructor(client: ExtendedClient) {
    super(client);
  }

  public async execute() {
    if (!this.client.user) return;
    console.log(`Logged in as ${this.client.user.tag}`);
    this.client.deploy();
  }
}
