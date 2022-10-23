/* eslint-disable @typescript-eslint/no-empty-interface */
export interface IConfig {
    test: Test;
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
interface Test {
    string: string;
    number: number;
    boolean: boolean;
    list: string[];
}
