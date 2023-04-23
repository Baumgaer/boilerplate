import { LEVEL, MESSAGE } from "triple-beam";
import { format, transports } from "winston";
import Configurator from "~client/lib/Configurator";
import CommonLogger from "~common/lib/Logger";
import type { StringKeyOf } from "type-fest";
import type { Logs } from "~client/@types/Config";

const configurator = new Configurator();

export default class Logger extends CommonLogger {

    public constructor(name: StringKeyOf<Logs>) {
        super(name);
        const methodMap: Record<string, string> = {
            log: "log",
            silly: "log",
            debug: "debug",
            info: "info",
            http: "info",
            verbose: "info",
            warn: "warn",
            error: "error"
        };

        this.logger.add(new transports.Console({
            log(info, next) {
                const level = methodMap[info[LEVEL]];
                Reflect.get(console, level)?.(info[MESSAGE]);
                next();
            },
            format: format.combine(
                format.label({ label: "" }),
                format.colorize({ message: true, colors: this.getColors() }),
                this.format
            )
        }));
    }

    protected override isAllowed() {
        const databases = configurator.get("databases.web.logging");
        if (this.name === "schema") return this.isAllowedSchema(databases);
        return super.isAllowed();
    }
}
