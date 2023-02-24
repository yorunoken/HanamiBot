const { v2, auth } = require("osu-api-extended")
require("dotenv/config");

async function hi(){
    await auth.login(process.env.client_id, process.env.client_secret);
    
    let score = await v2.user.scores.category(20656091, "recent", {
        include_fails: 1,
        mode: "osu",
        limit: "100",
        offset: "0",
    });
    
    console.log(score[1])
}

hi()