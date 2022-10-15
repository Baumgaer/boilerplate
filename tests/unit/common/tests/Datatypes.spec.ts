import { expect } from "chai";
// @ts-expect-error there are no type definitions
import * as randGen from "random-input-generator";
import { v1, v4 } from "uuid";
import { ZodError } from "zod";
import { Varchar, NumberRange, TextRange, Email, UUID } from "~common/lib/DataTypes";
import TestModel from "~env/models/TestModel";


export default function (_environment = "common") {
    describe('Datatypes', () => {
        it("should be lazy", () => {
            const schema = TestModel.getAttributeSchema("theLazyOne");
            expect(schema?.isLazy).to.be.true;
            expect(schema?.isStringType()).to.be.true;
        });

        it("should be a varchar", () => {
            const schema = TestModel.getAttributeSchema("theVarchar");
            expect(schema?.validator).to.be.equal("Varchar");
            expect(schema?.validate("")).to.be.true;
            expect(schema?.validate(randGen.generateString(0, 15))).to.be.true;
            expect(schema?.validate(randGen.generateString(16, 17))).to.be.an.instanceOf(AggregateError);

            const varchar = Varchar();
            expect(varchar.validate(randGen.generateString(0, 65535)).success).to.be.true;
            expect(varchar.validate(randGen.generateString(65536, 65537)).success).to.be.false;
            expect(varchar.guard(randGen.generateString(0, 65535))).to.be.true;
            expect(varchar.guard(randGen.generateString(65536, 65537))).to.be.false;
            expect(varchar.cast(randGen.generateString(65536, 65537))).to.have.a.lengthOf(65535);
        });

        it("should be a number range", () => {
            const schema = TestModel.getAttributeSchema("theNumberRange");
            expect(schema?.validator).to.be.equal("NumberRange");
            expect(schema?.validate(randGen.generateNumber(5, 15))).to.be.true;
            expect(schema?.validate(randGen.generateNumber(-Infinity, 4))).to.be.an.instanceOf(AggregateError);
            expect(schema?.validate(randGen.generateNumber(16, Infinity))).to.be.an.instanceOf(AggregateError);

            const numberRange = NumberRange();
            expect(numberRange.validate(randGen.generateNumber()).success).to.be.true;
            expect(numberRange.guard(randGen.generateNumber())).to.be.true;
            expect(numberRange.guard(randGen.generateString())).to.be.false;

            const aNumber = randGen.generateNumber();
            expect(numberRange.cast(String(aNumber))).to.be.equal(aNumber);
            expect(numberRange.cast(randGen.generateString())).to.be.equal(-Infinity);
        });

        it("should be a text range", () => {
            const schema = TestModel.getAttributeSchema("theTextRange");
            expect(schema?.validator).to.be.equal("TextRange");
            expect(schema?.validate(randGen.generateString(5, 15))).to.be.true;
            expect(schema?.validate(randGen.generateString(0, 4))).to.be.an.instanceOf(AggregateError);
            expect(schema?.validate(randGen.generateString(16, 20))).to.be.an.instanceOf(AggregateError);

            const textRange = TextRange();
            expect(textRange.validate(randGen.generateString()).success).to.be.true;
            expect(textRange.guard(randGen.generateString())).to.be.true;
            expect(textRange.guard(randGen.generateNumber())).to.be.false;

            const anotherTextRange = TextRange({ min: 3, max: 20 });
            expect(anotherTextRange.cast(randGen.generateString(0, 2))).to.have.a.lengthOf(3);
            expect(anotherTextRange.cast(randGen.generateString(21, 23))).to.have.a.lengthOf(20);
            expect(anotherTextRange.cast(randGen.generateNumber()).length).to.be.above(2).and.below(21);
        });

        it("should be an email", () => {
            const schema = TestModel.getAttributeSchema("theEmail");
            expect(schema?.validator).to.be.equal("Email");

            const validMail = `${randGen.generateString(3, 25, false)}@${randGen.generateString(3, 25, false)}.${randGen.generateString(2, 4, false)}`;
            expect(schema?.validate(validMail)).to.be.true;
            expect(schema?.validate(randGen.generateString())).to.be.an.instanceOf(AggregateError);

            const email = Email();
            expect(email.validate(validMail).success).to.be.true;
            expect(email.guard(validMail)).to.be.true;
            expect(email.guard(randGen.generateNumber())).to.be.false;
            expect(email.guard(randGen.generateString())).to.be.false;
            expect(email.cast(validMail)).to.be.equal(validMail);
            expect(email.cast(randGen.generateString())).to.be.an.instanceOf(ZodError);
        });

        it("should be an UUID", () => {
            const schema = TestModel.getAttributeSchema("aGeneratedColumn");
            expect(schema?.validator).to.be.equal("UUID");
            expect(schema?.validate(v1()), "v1").to.be.true;
            expect(schema?.validate(v4()), "v4").to.be.true;
            expect(schema?.validate(randGen.generateString())).to.be.an.instanceOf(AggregateError);

            const email = UUID();
            const validUUID = v1();
            expect(email.validate(v4()).success).to.be.true;
            expect(email.guard(v4())).to.be.true;
            expect(email.guard(randGen.generateNumber())).to.be.false;
            expect(email.guard(randGen.generateString())).to.be.false;
            expect(email.cast(validUUID)).to.be.equal(validUUID);
            expect(email.cast(randGen.generateString())).to.be.an.instanceOf(ZodError);
        });
    });
}