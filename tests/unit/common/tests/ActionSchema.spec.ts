import { expect } from "chai";
// import { ZodObject, ZodLazy, ZodString, ZodOptional, ZodNumber, ZodDate, ZodBoolean, ZodUnion, ZodLiteral, ZodTuple, ZodArray, ZodNull } from "zod";
import ActionSchema from "~env/lib/ActionSchema";
import ArgumentSchema from "~env/lib/ArgumentSchema";
import TestModel from "~env/models/TestModel";

const testModel = new TestModel();

export default function (_environment = "common") {
    describe('ActionSchema', () => {
        it("should create a query action schema", () => {
            const actionSchema = testModel.getActionSchema("testQueryAction");
            expect(actionSchema).to.be.an.instanceOf(ActionSchema);
            expect(actionSchema?.owner).to.be.equal(TestModel);
            expect(actionSchema?.name).to.be.equal("testQueryAction");
            expect(actionSchema?.local).to.be.false;
            expect(actionSchema?.isLazy).to.be.true;
            expect(actionSchema?.httpMethod).to.be.equal("GET");
        });

        it("should create a mutation action schema", () => {
            const actionSchema = testModel.getActionSchema("testMutationAction");
            expect(actionSchema).to.be.an.instanceOf(ActionSchema);
            expect(actionSchema?.owner).to.be.equal(TestModel);
            expect(actionSchema?.name).to.be.equal("testMutationAction");
            expect(actionSchema?.local).to.be.false;
            expect(actionSchema?.isLazy).to.be.true;
            expect(actionSchema?.httpMethod).to.be.equal("POST");
        });

        it("should have overwritten the options", () => {
            const actionSchema = testModel.getActionSchema("testQueryAction");
            actionSchema?.accessRight(null, testModel);
            expect(testModel.queryResult).to.be.equal("TestModel");
        });

        it("should have necessary argument schemas", async () => {
            const actionSchema = testModel.getActionSchema("testQueryAction");
            expect(actionSchema?.getArgumentSchema("id")).to.be.an.instanceOf(ArgumentSchema);
            expect(actionSchema?.getArgumentSchema("param1")).to.be.an.instanceOf(ArgumentSchema);
        });

        it("should update options", async () => {
            const actionSchema = testModel.getActionSchema("testQueryAction");
            actionSchema?.updateOptions({ local: true });
            expect(actionSchema?.local).to.be.true;
        });

        it("should validate correctly", async () => {
            const actionSchema = testModel.getActionSchema("testQueryAction");
            expect((await actionSchema?.validate(undefined))?.success).to.be.true;
            expect((await actionSchema?.validate(42))?.success).to.be.false;
        });
    });
}
