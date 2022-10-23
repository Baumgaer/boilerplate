/* eslint-disable @typescript-eslint/no-empty-interface */
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
