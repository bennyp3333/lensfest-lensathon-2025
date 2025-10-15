import { OnScreenLogger } from "./OnScreenLogger";

export class Logger {
    printInfoLogs: boolean;

    private readonly prefix: string;
    private readonly onScreenLogger: OnScreenLogger | null;

    constructor(private config: LoggerConfig, prefix: string) {
        this.prefix = prefix;
        this.printInfoLogs = config.printInfoLogs;

        if (config.printOnScreen) {
            this.onScreenLogger = OnScreenLogger.getInstance();
            this.onScreenLogger.fontSize = config.fontSize;
        }
    }

    logError(message: string): void {
        if (this.config.printErrors) {
            const withPrefix = "❌ " + this.withPrefix(message);
            print(withPrefix);
            this.onScreenLogger?.log(withPrefix);
        }
    }

    logWarning(message: string): void {
        if (this.config.printWarnings) {
            const withPrefix = "⚠️ " + this.withPrefix(message);
            print(withPrefix);
            this.onScreenLogger?.log(withPrefix);
        }
    }

    logInfo(message: string): void {
        if (this.printInfoLogs) {
            const withPrefix = "ℹ️ " + this.withPrefix(message);
            print(withPrefix);
            this.onScreenLogger?.log(withPrefix);
        }
    }

    private withPrefix(message: string): string {
        return "[" + this.prefix + "] " + message;
    }
}

@typedef
export class LoggerConfig {
    @input
    printOnScreen: boolean = true;

    @input
    @showIf("printOnScreen")
    fontSize: number = 12;

    @input
    printErrors: boolean = true;

    @input
    printWarnings: boolean = true;

    @input
    printInfoLogs: boolean = false;
}

export namespace LoggerConfig {
    export const mock = {
        printOnScreen: false,
        fontSize: 12,
        printErrors: false,
        printWarnings: false,
        printInfoLogs: false,
    };

}
