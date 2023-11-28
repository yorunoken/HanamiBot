import fs from "fs";
import { insertDataBulk } from "./src/utils";

async function main() {
  const files = fs.readdirSync("../2023_11_01_osu_files");

  const totalFiles = files.length;
  let filesProcessed = 0;

  const promises = files.map(async (file) => {
    const contents = await fs.promises.readFile(`../2023_11_01_osu_files/${file}`, "utf-8");
    filesProcessed++;
    updateProgressBar(filesProcessed, totalFiles);

    return { id: file.split(".")[0], contents };
  });

  const dataToInsert = await Promise.all(promises);

  clearProgressBar();
  console.log("Beatmaps collected, inserting to database.");

  insertDataBulk({ table: "maps", data: dataToInsert });
  console.log("Beatmaps have been inserted to database.");
}

function updateProgressBar(current: number, total: number) {
  const percentage = ((current / total) * 100).toFixed(2);
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`Collecting beatmaps.. ${percentage}%`);
}

function clearProgressBar() {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write("");
}
main();
