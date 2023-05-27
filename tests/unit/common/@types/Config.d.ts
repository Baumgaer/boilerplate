/* eslint-disable @typescript-eslint/no-empty-interface */
/*
 *   / \     THIS FILE IS AUTO GENERATED!
 *  / | \    DO NOT ADD CONTENT HERE!
 * /__.__\   THIS WILL BE OVERWRITTEN DURING NEXT GENERATION!
 */
export interface IConfig {
    config: Config;
    test: Test;
    common: Common;
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
interface Common {
    cors: Cors;
}
interface Cors {
    enable: boolean;
    policy: string;
}
interface Test {
    string: string;
    number: number;
    boolean: boolean;
    list: any[];
    testObject: TestObject;
    myObject: MyObject;
}
interface MyObject {
    string: string;
    number: number;
    boolean: boolean;
}
interface TestObject {
    test1: string;
    test2: string;
    test3: string;
    test4: number[];
}
interface Config {
    serverFQDN: string;
}
