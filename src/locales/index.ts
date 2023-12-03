import fs from "fs";
import { Locales } from "../Structure/index";

export class LocalizationManager {
  language: string;

  constructor(language: string) {
    this.language = language;
  }

  public checkLanguage(): boolean {
    return fs.existsSync(`./src/locales/${this.language}`);
  }

  public getLanguage(): Locales {
    return require(`./${this.language}`);
  }
}
