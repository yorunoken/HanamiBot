import db from "../src/data.db" with { type: "sqlite" };

const QUERY = process.argv.slice(2).join(" ");
console.log(QUERY);

try {
    db.query(QUERY).run();
} catch (e) {
    console.error("The query failed, here's the Error: \n", e);
}
