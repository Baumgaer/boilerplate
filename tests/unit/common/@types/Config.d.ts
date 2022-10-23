/* eslint-disable @typescript-eslint/no-empty-interface */
export interface IConfig {
    test: Test;
}
interface Test {
    testObject: TestObject;
}
interface TestObject {
    test1: string;
    test2: string;
}
