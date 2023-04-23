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
    server: Server;
}
interface Server {
    session: Session;
    engine: Engine;
    csp: Csp;
}
interface Csp {
    includeSelf: boolean;
    length: number;
    nonceAlgo: string;
    hashes: any[];
}
interface Engine {
    host: string;
    port: number;
    enableETag: boolean;
    maximumRequestBodySize: string;
    useQueryStringLibrary: boolean;
}
interface Session {
    maxAge: string;
    domain: string;
    name: string;
    sessionSecret: string;
    secure: boolean;
    resave: boolean;
    rolling: boolean;
    unset: string;
    secretAlgo: string;
}
interface Logs {
    schema: Schema;
    devel: Schema;
    server: Schema;
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
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
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
