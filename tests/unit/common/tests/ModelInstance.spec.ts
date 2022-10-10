import { expect } from "chai";
import { v4 } from "uuid";
import TestModel from "~env/models/TestModel";

const testModel = new TestModel({
    id: v4() as UUID,
    name: "TestModel",
    aDate: new Date(),
    aUselessField: null,
    anotherIntersection: { prop1: "test", prop2: 42, prop3: true },
    aTuple: ["test", 42, true],
    anInterface: { prop1: "test" },
    anArray: []
});

export default function () {
    describe('ModelInstance', () => {
        it("should not fail", () => {
            expect(testModel).to.be.an.instanceOf(TestModel);
        });
    });
}
