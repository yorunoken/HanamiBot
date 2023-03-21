require("dotenv/config");
const fs = require("fs");

async function login(client_id, client_secret) {
	const url = new URL("https://osu.ppy.sh/oauth/token");

	const headers = {
		Accept: "application/json",
		"Content-Type": "application/x-www-form-urlencoded",
	};

	let body = `client_id=${process.env.client_id}&client_secret=${process.env.client_secret}&grant_type=client_credentials&scope=public`;
	const Token = await fetch(url, {
		method: "POST",
		headers,
		body: body,
	}).then(response => response.json());
	const access_token = Token.access_token;

	fs.readFile(".env", "utf8", (err, data) => {
		if (err) {
			return err;
		}

		const modifiedData = data.replace(/osu_bearer_key=.*/, `osu_bearer_key=${access_token}`);

		fs.writeFile(".env", modifiedData, "utf8", err => {
			if (err) {
				return err;
			}
		});
	});
	return "osu! Token has been updated!";
}

module.exports = {
	auth: {
		login,
	},
};
