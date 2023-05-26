const { query } = require("./getQuery.js");
const { Message } = require("discord.js");

/**
 *
 * @param {Message} message
 */

async function login(message) {
  const text = message.content;

  const discordIdMatch = text.match(/discordID=(\w+)/i);
  const discordId = discordIdMatch ? discordIdMatch[1] : null;

  const userIdMatch = text.match(/userID=(\w+)/i);
  const userId = userIdMatch ? userIdMatch[1] : null;

  const qUser = await query({ query: `SELECT * FROM users WHERE id = ?`, parameters: [discordId], name: "value", type: "get" });
  if (!qUser) {
    await query({ query: `INSERT INTO users (id, value) VALUES (?, json_object('BanchoUserId', ?))`, parameters: [discordId, userId], type: "run" });
  } else {
    const q = `UPDATE users
      SET value = json_set(value, '$.BanchoUserId', ?)
      WHERE id = ?`;
    await query({ query: q, parameters: [userId, discordId], type: "run" });
  }
}

module.exports = { login };
