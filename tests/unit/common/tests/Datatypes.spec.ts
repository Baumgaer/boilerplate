import { expect } from "chai";
import { pick } from "lodash";
// @ts-expect-error there are no type definitions
import * as randGen from "random-input-generator";
import { v1, v4 } from "uuid";
import { ZodLazy, ZodNever, ZodObject } from "zod";
import { Varchar, NumberRange, TextRange, Email, UUID, Model } from "~common/lib/DataTypes";
import { getExtendedTestModelArgs } from "~env/TestUtils";
import TestModel from "~env/models/TestModel";
import type BaseAttribute from "~env/lib/BaseAttribute";
import type BaseModel from "~env/lib/BaseModel";

export default function (_environment = "common") {
    describe('Datatypes', () => {
        it("should be lazy", () => {
            const schema = TestModel.getAttributeSchema("theLazyOne");
            expect(schema?.isLazy).to.be.true;
            expect(schema?.isStringType()).to.be.true;
        });

        it("should be a varchar", async () => {
            const schema = TestModel.getAttributeSchema("theVarchar");
            expect(schema?.validator).to.be.equal("Varchar");
            expect((await schema?.validate(""))?.success).to.be.true;
            expect((await schema?.validate(randGen.generateString(0, 15)))?.success).to.be.true;
            expect((await schema?.validate(randGen.generateString(16, 17)))?.success).to.be.false;

            const varchar = Varchar();
            expect(varchar.validate(randGen.generateString(0, 65535)).success).to.be.true;
            expect(varchar.validate(randGen.generateString(65536, 65537)).success).to.be.false;
            expect(varchar.guard(randGen.generateString(0, 65535))).to.be.true;
            expect(varchar.guard(randGen.generateString(65536, 65537))).to.be.false;
            expect(varchar.cast(randGen.generateString(65536, 65537))).to.have.a.lengthOf(65535);
        });

        it("should be a number range", async () => {
            const schema = TestModel.getAttributeSchema("theNumberRange");
            expect(schema?.validator).to.be.equal("NumberRange");
            expect((await schema?.validate(randGen.generateNumber(5, 15)))?.success).to.be.true;
            expect((await schema?.validate(randGen.generateNumber(-Infinity, 4)))?.success).to.be.false;
            expect((await schema?.validate(randGen.generateNumber(16, Infinity)))?.success).to.be.false;

            const numberRange = NumberRange();
            expect(numberRange.validate(randGen.generateNumber()).success).to.be.true;
            expect(numberRange.guard(randGen.generateNumber())).to.be.true;
            expect(numberRange.guard(randGen.generateString())).to.be.false;

            const aNumber = randGen.generateNumber();
            expect(numberRange.cast(String(aNumber))).to.be.equal(aNumber);
            expect(numberRange.cast(randGen.generateString())).to.be.equal(-Infinity);
        });

        it("should be a text range", async () => {
            const schema = TestModel.getAttributeSchema("theTextRange");
            expect(schema?.validator).to.be.equal("TextRange");
            expect((await schema?.validate(randGen.generateString(5, 15)))?.success).to.be.true;
            expect((await schema?.validate(randGen.generateString(0, 4)))?.success).to.be.false;
            expect((await schema?.validate(randGen.generateString(16, 20)))?.success).to.be.false;

            const textRange = TextRange();
            expect(textRange.validate(randGen.generateString()).success).to.be.true;
            expect(textRange.guard(randGen.generateString())).to.be.true;
            expect(textRange.guard(randGen.generateNumber())).to.be.false;

            const anotherTextRange = TextRange({ min: 3, max: 20 });
            expect(anotherTextRange.cast(randGen.generateString(0, 2))).to.have.a.lengthOf(3);
            expect(anotherTextRange.cast(randGen.generateString(21, 23))).to.have.a.lengthOf(20);
            expect(anotherTextRange.cast("12345678")).to.have.a.lengthOf(8);
            expect(anotherTextRange.cast(randGen.generateNumber()).length).to.be.above(2).and.below(21);
        });

        it("should be an email", async () => {
            const schema = TestModel.getAttributeSchema("theEmail");
            expect(schema?.validator).to.be.equal("Email");

            const validMail = `${randGen.generateString(3, 25, false)}@${randGen.generateString(3, 25, false)}.${randGen.generateString(2, 4, false)}`;
            expect((await schema?.validate(validMail))?.success).to.be.true;
            expect((await schema?.validate(randGen.generateString()))?.success).to.be.false;

            const email = Email();
            expect(email.validate(validMail).success).to.be.true;
            expect(email.guard(validMail)).to.be.true;
            expect(email.guard(randGen.generateNumber())).to.be.false;
            expect(email.guard(randGen.generateString())).to.be.false;
            expect(email.cast(validMail)).to.be.equal(validMail);
            expect(email.cast(randGen.generateString())).to.be.an.instanceOf(AggregateError);
        });

        it("should be an UUID", async () => {
            const schema = TestModel.getAttributeSchema("aGeneratedColumn");
            expect(schema?.validator).to.be.equal("UUID");
            expect((await schema?.validate(v1()))?.success, "v1").to.be.true;
            expect((await schema?.validate(v4()))?.success, "v4").to.be.true;
            expect((await schema?.validate(randGen.generateString()))?.success).to.be.false;

            const uuid = UUID();
            const validUUID = v1();
            expect(uuid.validate(v4()).success).to.be.true;
            expect(uuid.guard(v4())).to.be.true;
            expect(uuid.guard(randGen.generateNumber())).to.be.false;
            expect(uuid.guard(randGen.generateString())).to.be.false;
            expect(uuid.cast(validUUID)).to.be.equal(validUUID);
            expect(uuid.cast(randGen.generateString())).to.be.an.instanceOf(AggregateError);
        });

        it("should be a Model", async () => {
            const staticModel = Model({ name: "TestModel", getAttribute: (name) => TestModel.getAttributeSchema(name) });

            const args = getExtendedTestModelArgs({ aDate: new Date() });

            expect((await staticModel.validate(Object.assign({}, args, { aNumber: 24 }))).success).to.be.false;

            const testModel = new TestModel(Object.assign({}, args));
            const model = Model({
                name: "TestModel",
                getAttribute: (name) => testModel.getAttribute(name) as BaseAttribute<typeof BaseModel> | null
            });
            const schemaType = model.schemaType as ZodLazy<ZodObject<any>>;

            expect(schemaType).to.be.an.instanceOf(ZodLazy);
            expect(schemaType.schema).to.be.an.instanceOf(ZodObject);

            const clone = pick(schemaType.schema.shape, Object.keys(args));
            expect(clone).to.to.have.keys(Object.keys(args));

            expect((await model.validate(testModel)).success).to.be.true;
            expect((await model.validate(args)).success).to.be.true;
            expect(model.guard<TestModel>(testModel)).to.be.true;
            expect(await model.cast(args)).to.be.an.instanceOf(TestModel);
            expect(await model.cast(testModel)).to.be.an.instanceOf(TestModel);
            expect(await model.cast(randGen.generateString())).to.be.an.instanceOf(AggregateError);
        });

        it("should be an Model datatype", async () => {
            const model = Model();
            expect(model.schemaType).to.be.an.instanceOf(ZodNever);
            expect((await model.validate({})).success).to.be.false;
            expect(model.guard<TestModel>({})).to.be.false;
            expect(await model.cast({})).to.be.an.instanceOf(AggregateError);
        });
    });
}
