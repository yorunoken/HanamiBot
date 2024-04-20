import { $ } from "bun";
import { c } from "tasai";

console.log(c.blue("Deleting caches and modules"));
console.log(await $`rm -rf node_modules`.text());
console.log(await $`rm -rf package-lock.json`.text());
console.log(c.green("Success\n"));

console.log(c.yellow("Installing dependencies"));
console.log(await $`bun install -D`.text());
console.log(c.green("Success\n"));

console.log(c.blue("Checking types"));
console.log(await $`bun check`.text());
