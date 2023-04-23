/* eslint-disable @typescript-eslint/no-empty-interface */
/*
 *   / \     THIS FILE IS AUTO GENERATED!
 *  / | \    DO NOT ADD CONTENT HERE!
 * /__.__\   THIS WILL BE OVERWRITTEN DURING NEXT GENERATION!
 */
export interface IConfig {
    config: Config;
    databases: Databases;
    logs: Logs;
}
interface Logs {
    schema: Schema;
    devel: Schema;
}
interface Schema {
    level: string;
    fileName: string;
    color: string;
    enabled: boolean;
}
interface Databases {
    common: Common;
    web: Common;
    server: Common;
}
interface Common {
    synchronize: boolean;
    autoSave: boolean;
    location: string;
    logger: string;
    logging: string[];
}
interface Config {
    logger: Logger;
}
interface Logger {
    logDirectory: string;
    maxSize: string;
    maxFiles: number;
    zippedArchive: boolean;
}
