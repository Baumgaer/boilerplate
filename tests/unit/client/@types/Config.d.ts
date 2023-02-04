/* eslint-disable @typescript-eslint/no-empty-interface */
/*
 *   / \     THIS FILE IS AUTO GENERATED!
 *  / | \    DO NOT ADD CONTENT HERE!
 * /__.__\   THIS WILL BE OVERWRITTEN DURING NEXT GENERATION!
 */
export interface IConfig {
    test: Test;
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
    type: string;
    useLocalForage: boolean;
}
interface Test {
    string: string;
    number: number;
    boolean: boolean;
    list: string[];
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
