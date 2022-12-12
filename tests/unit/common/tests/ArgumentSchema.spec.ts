import { expect } from "chai";
import { v4 } from "uuid";
import ActionSchema from "~env/lib/ActionSchema";
import ArgumentSchema from "~env/lib/ArgumentSchema";
import TestModel from "~env/models/TestModel";

const testModel = new TestModel();

export default function (_environment = "common") {
    describe('ArgumentSchema', () => {
        it("should create an id and param1 argument schema", () => {
            const actionSchema = testModel.getActionSchema("testQueryAction");
            expect(actionSchema).to.be.an.instanceOf(ActionSchema);

            const idArgumentSchema = actionSchema?.getArgumentSchema("id");
            expect(idArgumentSchema).to.be.an.instanceOf(ArgumentSchema);
            expect(idArgumentSchema?.index).to.be.equal(0);
            expect(idArgumentSchema?.primary).to.be.true;

            const param1ArgumentSchema = actionSchema?.getArgumentSchema("param1");
            expect(param1ArgumentSchema).to.be.an.instanceOf(ArgumentSchema);
            expect(param1ArgumentSchema?.index).to.be.equal(1);
            expect(param1ArgumentSchema?.primary).to.be.false;
            expect(param1ArgumentSchema?.max).to.be.equal(20);

            const param2ArgumentSchema = actionSchema?.getArgumentSchema("param2");
            expect(param2ArgumentSchema).to.be.an.instanceOf(ArgumentSchema);
            expect(param2ArgumentSchema?.index).to.be.equal(2);
            expect(param2ArgumentSchema?.primary).to.be.false;
        });

        it("should validate correctly", () => {
            const actionSchema = testModel.getActionSchema("testQueryAction");
            const idArgumentSchema = actionSchema?.getArgumentSchema("id");
            expect(idArgumentSchema?.validate(v4()).success).to.be.true;

            const param2ArgumentSchema = actionSchema?.getArgumentSchema("param2");
            expect(param2ArgumentSchema?.validate({ prop1: "test" }).success).to.be.true;
        });

        it("should overwrite options", () => {
            const actionSchema = testModel.getActionSchema("testQueryAction");
            const idArgumentSchema = actionSchema?.getArgumentSchema("id");
            idArgumentSchema?.updateOptions({ isLazy: true });
            expect(idArgumentSchema?.isLazy).to.be.true;
        });
    });
}
