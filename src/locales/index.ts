import fs from "fs";
import type { Locales, LocalesModule } from "../Structure/index";

export class LocalizationManager {
    public language: string;

    public constructor(language: string) {
        this.language = language;
    }

    public checkLanguage(): boolean {
        return fs.existsSync(`./src/locales/${this.language}.ts`);
    }

    public async getLanguage(): Promise<Locales> {
        const imported = await import(`./${this.language}.ts`) as LocalesModule;
        return imported.default;
    }
}
