import type TestModel from "~env/models/TestModel";

export const TestModelArgs = {
    name: "TestModel",
    aUselessField: null,
    anotherIntersection: { prop1: "test", prop2: 42, prop3: true },
    aTuple: ["test", 42, true],
    anInterface: { prop1: "test" },
    anArray: ["4", "5", "6", "7"]
} as ConstructionParams<TestModel>;


export function getExtendedTestModelArgs(obj: Record<string, any> = {}) {
    return Object.assign({}, TestModelArgs, obj);
}
