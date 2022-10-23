import { expect } from "chai";
import { isEqual } from "lodash";
import Configurator from "~env/lib/Configurator";

const configurator = new Configurator();

export default function (_environment = "common") {
    describe('Configurator', () => {
        it("should load the correct config object", () => {
            const test = configurator.get("test");
            expect(isEqual(test, {
                "string": "42",
                "number": 42,
                "boolean": true,
                "list": ["1", "2"],
                "testObject": {
                    "test1": "",
                    "test2": "boolean",
                    "test3": "object",
                    "test4": [42, 43]
                },
                "myObject": {
                    "string": "test",
                    "number": 1,
                    "boolean": false
                }
            })).to.be.true;
        });

        it("should set the new Value", () => {
            expect(configurator.set("test.boolean", false)).to.be.true;
            expect(configurator.get("test.boolean")).to.be.false;

            const newMyObject = { boolean: true, number: 2, string: "tester" };
            expect(configurator.set("test.myObject", newMyObject)).to.be.true;
            expect(isEqual(configurator.get("test.myObject"), newMyObject)).to.be.true;

            expect(configurator.set("test.list.2", "3")).to.be.true;
            expect(configurator.get("test.list.2")).to.be.equal("3");

            const newTestObject = { test1: "test1", test2: "test2", test3: "test 3", test4: [1, 2, 3] };
            expect(configurator.set("test.testObject", newTestObject)).to.be.true;
            expect(isEqual(configurator.get("test.testObject"), newTestObject)).to.be.true;
        });

        it("should not set the new Value", () => {
            // @ts-expect-error 003
            expect(configurator.set("test.boolean", "test")).to.be.false;
            expect(configurator.get("test.boolean")).to.be.false;

            const validTestObject = { test1: "test1", test2: "test2", test3: "test 3", test4: [1, 2, 3] };
            // @ts-expect-error 003
            expect(configurator.set("test.testObject", { test1: 1337 })).to.be.false;
            expect(isEqual(configurator.get("test.testObject"), validTestObject)).to.be.true;
        });

        it("should produce an any array", () => {
            expect(configurator.set("test.list", []), "setting empty array").to.be.true;
            expect(configurator.get("test.list")).to.have.a.lengthOf(0);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore 003
            expect(configurator.set("test.list", [42]), "setting number array").to.be.true;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore 003
            expect(isEqual(configurator.get("test.list"), [42]), "comparing number arrays").to.be.true;
            configurator.set("test.list", []);
            expect(configurator.set("test.list.0", "42")).to.be.true;
            expect(configurator.get("test.list.0")).to.be.equal("42");
        });
    });
}
