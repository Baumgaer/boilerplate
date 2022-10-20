import { expect } from "chai";
import { pick, isEqual } from "lodash";
import { v4 } from "uuid";
import TestModel from "~env/models/TestModel";
import TestMyTestModel from "~env/models/TestMyTestModel";

const args = {
    name: "TestModel",
    aUselessField: null,
    anotherIntersection: { prop1: "test", prop2: 42, prop3: true },
    aTuple: ["test", 42, true],
    anInterface: { prop1: "test" },
    anArray: ["4", "5", "6", "7"],
    aString: "lolHaha"
} as ConstructionParams<TestModel>;
const testModel = new TestModel(Object.assign({}, args, { oneToOne: new TestMyTestModel({ name: "TestMyTestModel" }) }));

export default function (_environment = "common") {
    describe('ModelInstance', () => {
        it("should successfully validate the dummy test model", () => {
            const result = testModel.validate();
            expect(result.success).to.be.true;
        });

        it("should get the dummyId id first and the given id then", () => {
            expect(testModel.getId()).to.be.equal(testModel.dummyId);
            Reflect.set(testModel, "id", v4());
            expect(testModel.getId()).to.be.equal(testModel.id);
        });

        it("should successfully validate the final test model", () => {
            testModel.removeChanges();
            expect(testModel.validate().success).to.be.true;
            expect(testModel.validate({ aString: "meep" }).success).to.be.false;
        });

        it("should recognize the inexistent key", () => {
            testModel.removeChanges();
            expect(testModel.validate({ inexistentKey: true }).errors[0].name).to.be.equal("InexistentError");
        });

        it("should recognize the internal key", () => {
            testModel.removeChanges();
            expect(testModel.validate({ aNumber: 42 }).errors[0].name).to.be.equal("ForbiddenError");
        });

        it("should give an object variant ob the model", () => {
            const result = testModel.toObject();
            const clone = pick(result, Object.keys(args));
            expect(isEqual(clone, args)).to.be.true;
        });

        it("should be a valid JSON with all necessary properties", () => {
            const result = testModel.toJson();
            expect(JSON.parse.bind(JSON, result)).not.to.throw();

            const clone = pick(JSON.parse(result), Object.keys(args));
            expect(isEqual(clone, args)).to.be.true;
        });

        it("should apply changes", () => {
            testModel.applyChanges({ aBoolean: [{ type: "change", value: false, path: [], previousValue: true }] });
            expect(testModel.aBoolean).to.be.false;
            expect(isEqual(testModel.getChanges(), {})).to.be.true;
        });

        it("should undo changes", () => {
            testModel.aBoolean = true;
            testModel.undoChanges();
            expect(testModel.aBoolean).to.be.false;
            expect(isEqual(testModel.getChanges(), {})).to.be.true;
        });
    });
}
