import { resolve } from "path";
import { transports, format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import CommonLogger from "~common/lib/Logger";
import Configurator from "~server/lib/Configurator";
import type { StringKeyOf } from "type-fest";
import type { Logs } from "~server/@types/Config";

const configurator = new Configurator();

export default class Logger extends CommonLogger {

    public constructor(name: StringKeyOf<Logs>) {
        super(name);

        this.logger.add(new transports.Console({
            format: format.combine(
                format.label({ label: String(process.pid) }),
                format.colorize({ message: true, colors: this.getColors() }),
                this.format
            )
        }));

        this.logger.add(new DailyRotateFile({
            level: "error",
            filename: `error - %DATE%`,
            dirname: resolve(configurator.get("config.logger.logDirectory")),
            format: format.combine(this.format)
        }));

        const fileName = this.getFileName();
        if (fileName) {
            this.logger.add(new DailyRotateFile({
                filename: `${fileName} - %DATE%`,
                dirname: resolve(configurator.get("config.logger.logDirectory")),
                format: format.combine(this.format)
            }));
        }
    }

    protected override isAllowed(): boolean {
        const databases = configurator.get("databases.server.logging");
        if (this.name === "schema") return this.isAllowedSchema(databases);
        return super.isAllowed();
    }

    private getFileName() {
        const logs = configurator.get("logs");

        if (!logs) return null;
        if (!(this.name in logs)) return null;

        const log = logs[this.name as keyof typeof logs];
        return log.fileName ?? null;
    }
}
