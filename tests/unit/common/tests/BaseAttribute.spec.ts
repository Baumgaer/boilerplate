import { expect } from "chai";
import { AttributeError } from "~common/lib/Errors";
import BaseAttribute from "~env/lib/BaseAttribute";
import { TypeError } from "~env/lib/Errors";
import TestModel from "~env/models/TestModel";
import { isEqual } from "~env/utils/utils";
import type { IAttributeChange } from "~env/@types/AttributeSchema";

const testModel = new TestModel();

export default function (_environment = "common") {
    describe('BaseAttribute', () => {
        it("should get the current date", () => {
            expect(testModel.aDate?.toISOString().split(".")[0]).to.be.equal(new Date().toISOString().split(".")[0]);
            expect(testModel.getterCount).to.be.equal(2);  // Counting the initial undefined value
        });

        it("should trigger the setter", () => {
            testModel.anArray = [];
            expect(isEqual(testModel.anArray, ["1", "2", "3"])).to.be.true;
            expect(testModel.setterCount).to.be.equal(1);  // Respecting the initial undefined value

            testModel.anArray = ["5"];
            expect(isEqual(testModel.anArray, ["5"])).to.be.true;
            expect(testModel.setterCount).to.be.equal(2);  // Respecting the initial undefined value
        });

        it("should trigger the validator", () => {
            let result = testModel.validate({ aString: "lol" });
            expect(result.success).to.be.true;
            expect(testModel.validateCount).to.be.equal(1);

            result = testModel.validate({ aString: "meep" });
            expect(result.success).to.be.false;
            expect(result.errors[0]).to.be.an.instanceOf(AttributeError);
            expect(testModel.validateCount).to.be.equal(2);

            result = testModel.validate({ aString: 24 });
            expect(result.success).to.be.false;
            expect(result.errors[0]).to.be.an.instanceOf(TypeError);
            expect(testModel.validateCount).to.be.equal(2); // Validator is only triggered when type is correct
        });

        it("should trigger the observer", () => {
            let value: any = ["test", 42];
            testModel.aTuple = value;
            expect(isEqual(testModel.aTuple, value), `onChange aTuple value: ${testModel.aTuple}`).to.be.true;
            expect(isEqual(testModel.hookValue, value), `onChange aTuple parameter value comparison`).to.be.true;
            expect(isEqual(testModel.hookParameters, { path: [], oldValue: undefined }), `onChange aTuple parameter parameters comparison`).to.be.true;
            expect(testModel.changeCount, "onChange counter").to.be.equal(1);  // Respecting the initial undefined value of aTuple and value of anInterface

            value = ["test", 42, true];
            testModel.aTuple.push(true);
            expect(isEqual(testModel.aTuple, value), `onAdd value: ${testModel.aTuple}`).to.be.true;
            expect(testModel.hookValue, `onAdd parameter value comparison`).to.be.true;
            expect(isEqual(testModel.hookParameters, { path: ["2"], oldValue: undefined }), `onAdd parameter parameters comparison`).to.be.true;
            expect(testModel.addCount, "onAdd").to.be.equal(1);  // Respecting the initial undefined value

            value = ["test", 42];
            testModel.aTuple.pop();
            expect(isEqual(testModel.aTuple, value), `onRemove value: ${testModel.aTuple}`).to.be.true;
            expect(testModel.hookValue, `onRemove parameter value comparison`).to.be.true;  // onRemove receives the removed value
            expect(isEqual(testModel.hookParameters, { path: ["2"], oldValue: true }), `onRemove parameter parameters comparison`).to.be.true;
            expect(testModel.removeCount, "onRemove").to.be.equal(1);  // Respecting the initial undefined value

            value = ["testi", 42];
            testModel.aTuple[0] = "testi";
            expect(isEqual(testModel.aTuple, value), `onChange value: ${testModel.aTuple}`).to.be.true;
            expect(testModel.removeCount, "onRemove").to.be.equal(2);
            expect(testModel.addCount, "onAdd").to.be.equal(2);

            value = { prop1: "test" };
            testModel.anInterface = value;
            expect(isEqual(testModel.anInterface, value), `onChange anInterface value: ${testModel.anInterface}`).to.be.true;
            expect(isEqual(testModel.hookValue, value), `onChange anInterface parameter value comparison`).to.be.true;
            expect(isEqual(testModel.hookParameters, { path: [], oldValue: undefined }), `onChange anInterface parameter parameters comparison`).to.be.true;
            expect(testModel.changeCount, "onChange anInterface").to.be.equal(2);

            value = { prop1: "testen" };
            testModel.anInterface.prop1 = "testen";
            expect(isEqual(testModel.anInterface, value), `onChange anInterface2 value: ${testModel.anInterface}`).to.be.true;
            expect(testModel.hookValue, `onChange anInterface2 parameter value comparison`).to.be.equal("testen");
            expect(isEqual(testModel.hookParameters, { path: ["prop1"], oldValue: "test" }), `onChange anInterface2 parameter parameters comparison`).to.be.true;
            expect(testModel.changeCount, "onChange anInterface2").to.be.equal(3);
        });

        it("should generate changes", () => {
            const unionAttribute = testModel.getAttribute("anUnion") as unknown as BaseAttribute<typeof TestModel>;
            expect(unionAttribute).to.be.an.instanceOf(BaseAttribute);
            expect(unionAttribute.hasChanges()).to.be.true;  // Respect init change

            testModel.anUnion = "Test";
            expect(unionAttribute.hasChanges()).to.be.true;

            const unionChanges = unionAttribute.getChanges();
            expect(unionChanges).has.a.lengthOf(2);
            expect(unionChanges[0].type).to.be.equal("init");
            expect(unionChanges[0].value).to.be.equal(42);
            expect(unionChanges[0].previousValue).to.be.undefined;

            expect(unionChanges[1].type).to.be.equal("change");
            expect(unionChanges[1].value).to.be.equal("Test");
            expect(unionChanges[1].previousValue).to.be.equal(42);

            const aTupleAttribute = testModel.getAttribute("aTuple") as unknown as BaseAttribute<typeof TestModel>;
            expect(aTupleAttribute).to.be.an.instanceOf(BaseAttribute);

            testModel.aTuple = ["test", 42];
            aTupleAttribute.removeChanges();
            testModel.aTuple.push(true);
            testModel.aTuple.pop();

            const tupleChanges = aTupleAttribute.getChanges();
            expect(tupleChanges[0].type).to.be.equal("add");
            expect(isEqual(tupleChanges[0].path, ["2"])).to.be.true;
            expect(tupleChanges[0].value).to.be.equal(true);
            expect(tupleChanges[0].previousValue).to.be.undefined;

            expect(tupleChanges[1].type).to.be.equal("remove");
            expect(isEqual(tupleChanges[1].path, ["2"])).to.be.true;
            expect(tupleChanges[1].value).to.be.undefined;
            expect(tupleChanges[1].previousValue).to.be.equal(true);
            expect(tupleChanges).has.a.lengthOf(2);
        });

        it("should undo changes", () => {
            const unionAttribute = testModel.getAttribute("anUnion") as unknown as BaseAttribute<typeof TestModel>;
            expect(unionAttribute).to.be.an.instanceOf(BaseAttribute);

            unionAttribute.undoChanges();
            expect(testModel.anUnion).to.be.undefined;

            const aTupleAttribute = testModel.getAttribute("aTuple") as unknown as BaseAttribute<typeof TestModel>;
            expect(aTupleAttribute).to.be.an.instanceOf(BaseAttribute);

            aTupleAttribute.undoChanges();
            expect(isEqual(testModel.aTuple, ["test", 42])).to.be.true;
        });

        it("should apply changes", () => {
            const aTupleAttribute = testModel.getAttribute("aTuple") as unknown as BaseAttribute<typeof TestModel>;
            expect(aTupleAttribute).to.be.an.instanceOf(BaseAttribute);
            aTupleAttribute.removeChanges();

            const changes: IAttributeChange[] = [
                { type: "init", path: [], value: ["testen", 24], previousValue: undefined },
                { type: "change", path: [], value: ["testen", 42], previousValue: ["testen", 24] },
                { type: "add", path: ["2"], value: false, previousValue: undefined },
                { type: "remove", path: ["2"], value: undefined, previousValue: false }
            ];
            aTupleAttribute.applyChanges(changes);

            expect(isEqual(testModel.aTuple, ["testen", 42])).to.be.true;
            expect(isEqual(aTupleAttribute.getChanges(), [])).to.be.true;  // applyChanges does not generate changes
        });

        it("should adjust changes", () => {
            const anArrayAttribute = testModel.getAttribute("anArray") as unknown as BaseAttribute<typeof TestModel>;
            expect(anArrayAttribute).to.be.an.instanceOf(BaseAttribute);
            Reflect.set(testModel, "anArray", undefined);
            anArrayAttribute.removeChanges();

            testModel.anArray = ["1"];
            testModel.anArray.push("2", "3", "4");
            let changes: IAttributeChange[] = [
                { type: "add", path: ["0"], value: "0.5", previousValue: undefined },
                { type: "add", path: ["1"], value: "1.5", previousValue: undefined }
            ];
            anArrayAttribute.applyChanges(changes);
            expect(isEqual(anArrayAttribute.getChanges(), [
                { type: 'init', path: [], value: [], previousValue: undefined },
                { type: 'add', path: ['2'], value: '1', previousValue: undefined },
                { type: 'add', path: ['3'], value: '2', previousValue: undefined },
                { type: 'add', path: ['4'], value: '3', previousValue: undefined },
                { type: 'add', path: ['5'], value: '4', previousValue: undefined }
            ])).to.be.true;

            anArrayAttribute.removeChanges();
            testModel.anArray.push("5", "6", "7");
            changes = [
                { type: "remove", path: ["0"], value: "1.5", previousValue: "0.5" },
                { type: "remove", path: ["1"], value: "1", previousValue: "1.5" }
            ];
            anArrayAttribute.applyChanges(changes);
            expect(isEqual(anArrayAttribute.getChanges(), [
                { type: 'add', path: ['4'], value: '5', previousValue: undefined },
                { type: 'add', path: ['5'], value: '6', previousValue: undefined },
                { type: 'add', path: ['6'], value: '7', previousValue: undefined }
            ])).to.be.true;
        });

        it("should generate changes with all array functions", () => {
            const anArrayAttribute = testModel.getAttribute("anArray") as unknown as BaseAttribute<typeof TestModel>;
            expect(anArrayAttribute).to.be.an.instanceOf(BaseAttribute);
            Reflect.set(testModel, "anArray", undefined);
            anArrayAttribute.removeChanges();
            testModel.anArray = ["1"];

            testModel.anArray.push("2", "3", "4", "5");
            testModel.anArray.pop();
            testModel.anArray.unshift("0.5");
            testModel.anArray.shift();
            testModel.anArray.copyWithin(0, 2);
            testModel.anArray.fill("0", 0, 2);
            testModel.anArray.splice(2, 2);
            expect(isEqual(anArrayAttribute.getChanges(), [
                { type: 'init', path: [], value: [], previousValue: undefined },
                { type: 'add', path: ['0'], value: '1', previousValue: undefined },
                { type: 'add', path: ['1'], value: '2', previousValue: undefined },
                { type: 'add', path: ['2'], value: '3', previousValue: undefined },
                { type: 'add', path: ['3'], value: '4', previousValue: undefined },
                { type: 'add', path: ['4'], value: '5', previousValue: undefined },
                { type: 'remove', path: ['4'], value: undefined, previousValue: '5' },
                { type: 'add', path: ['0'], value: '0.5', previousValue: undefined },
                { type: 'remove', path: ['0'], value: undefined, previousValue: '0.5' },
                { type: 'remove', path: ['0'], value: undefined, previousValue: '1' },
                { type: 'add', path: ['0'], value: '3', previousValue: undefined },
                { type: 'remove', path: ['1'], value: undefined, previousValue: '2' },
                { type: 'add', path: ['1'], value: '4', previousValue: undefined },
                { type: 'remove', path: ['0'], value: undefined, previousValue: '3' },
                { type: 'add', path: ['0'], value: '0', previousValue: undefined },
                { type: 'remove', path: ['1'], value: undefined, previousValue: '4' },
                { type: 'add', path: ['1'], value: '0', previousValue: undefined },
                { type: 'remove', path: ['2'], value: undefined, previousValue: '3' },
                { type: 'remove', path: ['3'], value: undefined, previousValue: '4' }
            ])).to.be.true;
        });

        it("should validate", () => {
            const aTupleAttribute = testModel.getAttribute("aTuple") as unknown as BaseAttribute<typeof TestModel>;
            expect(aTupleAttribute).to.be.an.instanceOf(BaseAttribute);
            expect(aTupleAttribute.validate(testModel.aTuple).success).to.be.true;
            expect(aTupleAttribute.validate(testModel.aBoolean).success).to.be.false;  // it's new, so an AggregateError is expected
        });
    });
}
