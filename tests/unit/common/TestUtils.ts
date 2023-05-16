import type TestModelParams from "~env/interfaces/models/TestModel";

const fixedDate = new Date("1995-12-17T03:24:00");
export const TestModelArgs = {
    name: "TestModel",
    aUselessField: null,
    anotherIntersection: { prop1: "test", prop2: 42, prop3: true },
    aTuple: ["test", 42, true],
    anInterface: { prop1: "test" },
    anArray: ["4", "5", "6", "7"],
    aDate: fixedDate
} satisfies TestModelParams;


export function getExtendedTestModelArgs<TObj extends Record<string, any>>(obj: TObj = {} as TObj): typeof TestModelArgs & TObj {
    return Object.assign({}, TestModelArgs, obj);
}
