/* eslint-disable @typescript-eslint/no-empty-interface */
/*
 *   / \     THIS FILE IS AUTO GENERATED!
 *  / | \    DO NOT ADD CONTENT HERE!
 * /__.__\   THIS WILL BE OVERWRITTEN DURING NEXT GENERATION!
 */
export interface IConfig {
    databases: Databases;
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
