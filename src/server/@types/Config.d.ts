/* eslint-disable @typescript-eslint/no-empty-interface */
/*
 *   / \     THIS FILE IS AUTO GENERATED!
 *  / | \    DO NOT ADD CONTENT HERE!
 * /__.__\   THIS WILL BE OVERWRITTEN DURING NEXT GENERATION!
 */
export interface IConfig {
    databases: Databases;
    server: Server2;
}
interface Server2 {
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
interface Databases {
    server: Server;
}
interface Server {
    type: string;
    host: string;
    port: number;
    database: string;
    autoSave: boolean;
    location: string;
    logger: string;
    logging: string[];
}
