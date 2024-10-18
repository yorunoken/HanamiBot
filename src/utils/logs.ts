import { mkdir, access, readFile, writeFile } from "node:fs/promises";

async function exists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch (e) {
        return false;
    }
}

export async function log(message: string, isError?: boolean): Promise<void> {
    const date = new Date(Date.now());
    const formattedDate = `${new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
    }).format(date)}  |  `;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const year = date.getFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const monthName = monthNames[date.getUTCMonth()];
    const day = date.getUTCDate().toString().padStart(2, "0");

    const logsFolder = "./logs";
    if (!(await exists(logsFolder))) {
        console.log("The logs folder couldn't be found. generating..");
        await mkdir(logsFolder, { recursive: true });
    }

    const yearFolder = `${logsFolder}/${year}`;
    if (!(await exists(yearFolder))) {
        console.log(`The year \`${year}\` couldn't be found, generating..`);
        await mkdir(yearFolder, { recursive: true });
    }

    const monthFolder = `${logsFolder}/${year}/${month}`;
    if (!(await exists(monthFolder))) {
        console.log(`The month \`${monthName}(${month})\` couldn't be found, generating..`);
        await mkdir(monthFolder, { recursive: true });
    }

    const dayFolder = `${logsFolder}/${year}/${month}/${day}.log`;
    if (!(await exists(dayFolder))) {
        console.log(`The day \`${day}\` couldn't be found, generating..`);
        await writeFile(dayFolder, `${formattedDate}Created log file.`);
    }

    const todaysLogFile = await readFile(dayFolder, "utf-8");
    await writeFile(dayFolder, `${todaysLogFile}\n${formattedDate}${message}`);
    console[isError ? "error" : "log"](`${formattedDate}${message}`);
}
