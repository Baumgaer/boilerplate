/* eslint-disable @typescript-eslint/no-empty-interface */
/*
 *   / \     THIS FILE IS AUTO GENERATED!
 *  / | \    DO NOT ADD CONTENT HERE!
 * /__.__\   THIS WILL BE OVERWRITTEN DURING NEXT GENERATION!
 */
export interface IConfig {
    common: Common;
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
    common: Common2;
    web: Common2;
    server: Common2;
}
interface Common2 {
    synchronize: boolean;
    autoSave: boolean;
    location: string;
    logger: string;
    logging: string[];
}
interface Config {
    logger: Logger;
    serverFQDN: string;
}
interface Logger {
    logDirectory: string;
    maxSize: string;
    maxFiles: number;
    zippedArchive: boolean;
}
interface Common {
    cors: Cors;
}
interface Cors {
    enable: boolean;
    policy: string;
}
