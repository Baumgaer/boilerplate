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
    web: Web;
}
interface Web {
    type: string;
    autoSave: boolean;
    location: string;
    useLocalForage: boolean;
    logger: string;
    logging: string[];
}
