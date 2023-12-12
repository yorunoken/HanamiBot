import { getUser, insertData } from "./src/utils";

function thing(): void {
    console.log("hi");
    insertData({
        table: "users",
        id: "372343076578131968",
        data: [ { name: "banchoId", value: "72777" } ]
    });
}
thing();
