import { Interaction, Message } from "@lilybird/transformers";

export class OsuArgs {
    private message?: Message;
    private stringArgs?: Array<string>;

    private interaction?: Interaction;
    private defaultArgs: Array<string>;

    constructor() {
        this.defaultArgs = ["mods"];
    }

    public fromMessage(message: Message, stringArgs: Array<string>) {
        this.message = message;
        this.stringArgs = stringArgs;
    }

    public fromInteraction(interaction: Interaction) {
        this.interaction = interaction;
    }

    public getArgs(wanted: Array<string> = this.defaultArgs) {
        if (this.message) {
            return this.argsFromMessage(wanted);
        }

        if (this.interaction) {
            return this.argsFromInteraction(wanted);
        }
    }

    private argsFromMessage(wanted: Array<string>) {
        if (!this.message || !this.stringArgs) {
            return null;
        }
    }

    private argsFromInteraction(wanted: Array<string>) {
        if (!this.interaction) {
            return null;
        }
    }
}
