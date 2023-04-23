import { createLogger, format } from "winston";
import Configurator from "~env/lib/Configurator";
import type { StringKeyOf } from "type-fest";
import type { Logger as WinstonLogger } from "winston";
import type { Logs } from "~env/@types/Config";

const configurator = new Configurator();

export default class Logger {

    public readonly name: string;

    protected logger: WinstonLogger;

    public constructor(name: StringKeyOf<Logs>) {
        this.name = name;
        this.logger = createLogger({ level: configurator.get(`logs.${name}.level`)?.toLowerCase?.() });
    }

    protected get format() {
        return format.combine(
            format.splat(),
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.align(),
            format.prettyPrint(),
            format.printf(info => {
                const { level, message, timestamp, label } = info;
                return `${timestamp} ${label} ${level.toLocaleUpperCase()}: ${message}`;
            })
        );
    }

    public raw(...args: any[]) {
        if (!this.isAllowed()) return;
        this.logger.log(this.logger.level, "Logging raw output:");
        if (this.logger.isLevelEnabled(this.logger.level)) console.log(...args);
    }

    public log(message: any, ...meta: any[]) {
        if (!this.isAllowed()) return;
        this.logger.log("silly", message, ...meta);
    }

    public info(message: any, ...meta: any[]) {
        if (!this.isAllowed()) return;
        this.logger.log("info", message, ...meta);
    }

    public debug(message: any, ...meta: any[]) {
        if (!this.isAllowed()) return;
        this.logger.log("debug", message, ...meta);
    }

    public warn(message: any, ...meta: any[]) {
        if (!this.isAllowed()) return;
        this.logger.log("warn", message, ...meta);
    }

    public error(message: any, ...meta: any[]) {
        if (!this.isAllowed()) return;
        this.logger.log("error", message, ...meta);
    }

    protected getColors() {
        let colors = undefined;
        const color = this.getColor();
        if (color) colors = { error: color, debug: color, warn: color, data: color, info: color, verbose: color, silly: color };
        return colors;
    }

    protected isAllowedSchema(databases: string | string[]) {
        if (Array.isArray(databases)) {
            if (databases.includes("schema")) return true;
            if (databases.includes("all")) return true;
        } else if (typeof databases === "string") {
            if (["schema", "all"].includes(databases)) return true;
        }
        return false;
    }

    protected isAllowed() {
        const logs = configurator.get("logs");
        return logs?.[this.name as keyof typeof logs]?.enabled;
    }

    private getColor() {
        const logs = configurator.get("logs");
        return logs?.[this.name as keyof typeof logs]?.color;
    }


}
