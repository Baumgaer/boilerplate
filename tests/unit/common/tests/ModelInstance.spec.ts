import { expect } from "chai";
import { pick, isEqual } from "lodash";
import { v1 } from "uuid";
import { getExtendedTestModelArgs } from "~env/TestUtils";
import TestModel from "~env/models/TestModel";
import TestMyTestModel from "~env/models/TestMyTestModel";
import type { AttributeError } from "~env/lib/Errors";

const args = getExtendedTestModelArgs({ aString: "lolHaha" } as const);
// @ts-expect-error Date makes it hard to compare
delete args.aDate;
const testModel = new TestModel(Object.assign({}, args, { oneToOne: new TestMyTestModel({ name: "TestMyTestModel" }) }));

export default function (_environment = "common") {
    describe('ModelInstance', () => {
        it("should successfully validate the dummy test model", async () => {
            expect((await testModel.validate()).success).to.be.true;
        });

        it("should get the dummyId id first and the given id then", () => {
            expect(testModel.getId()).to.be.equal(testModel.dummyId);
            Reflect.set(testModel, "id", v1());
            expect(testModel.getId()).to.be.equal(testModel.id);
        });

        it("should successfully validate the final test model", async () => {
            testModel.removeChanges();
            expect((await testModel.validate()).success).to.be.true;
            expect((await testModel.validate({ aString: "meep" })).success).to.be.false;
        });

        it("should recognize the inexistent key", async () => {
            testModel.removeChanges();
            const error = (await testModel.validate({ inexistentKey: true })).errors[0] as AttributeError;
            expect(error.name).to.be.equal("AttributeError");
            expect(error.kind).to.be.equal("inexistent");
        });

        it("should recognize the internal key", async () => {
            testModel.removeChanges();
            const error = (await testModel.validate({ aNumber: 42 })).errors[0] as AttributeError;
            expect(error.name).to.be.equal("AttributeError");
            expect(error.kind).to.be.equal("forbidden");
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

        it("should not have changes", () => {
            const newTestModel = new TestModel(getExtendedTestModelArgs({ id: v1() as UUID }));
            expect(Object.keys(newTestModel.getChanges()).length).to.be.equal(0);
        });
    });
}
