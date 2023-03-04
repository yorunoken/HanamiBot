const axios = require("axios")
require("dotenv/config")
const endpoint = `https://osudaily.net/api/`
const apiKey = process.env.osudaily_api

async function main() {
	const response = await axios.get(`${endpoint}pp.php?k=${apiKey}&t=rank&v=10000`)
	const data = response.data
	console.log(data)
}

main()
