import { expect } from "chai";
// @ts-expect-error there are no type definitions
import * as randGen from "random-input-generator";
import { v4 as uuIdV4 } from "uuid";
import { ZodObject, ZodLazy, ZodString, ZodOptional, ZodNumber, ZodDate, ZodBoolean, ZodUnion, ZodLiteral, ZodIntersection, ZodEffects, ZodTuple, ZodArray, ZodNull } from "zod";
import TestModel from "~env/models/TestModel";
import TestMyTestModel from "~env/models/TestMyTestModel";
import TestMyTesterModel from "~env/models/TestMyTesterModel";
import { hasOwnProperty } from "~env/utils/utils";
import type { ZodRawShape, ZodUndefined } from "zod";

export default function () {
    describe('AttributeSchema', () => {
        it(`has a primary id column`, () => {
            const schema = TestModel.getAttributeSchema("id");
            expect(schema).not.to.be.undefined.and.not.to.be.null;
            expect(schema).to.have.property("primary", true);
            expect(schema).to.have.property("validator", "UUID");

            const schemaType = schema?.getSchemaType() as ZodString | undefined;
            expect(schemaType).not.to.be.undefined.and.not.to.be.null;
            expect(schemaType).to.be.instanceOf(ZodString);
            expect(schemaType?.isUUID).to.be.true;
        });

        it(`has an required "aDate" and "aNumber" attribute`, () => {
            const attrs = ["aDate", "aNumber"] as const;
            for (const attr of attrs) {
                // @ts-expect-error 002
                const schema = TestModel.getAttributeSchema(attr);
                expect(schema).not.to.be.undefined.and.not.to.be.null;
                expect(schema).to.have.property("isRequired", true);
            }
        });

        it(`has an internal "aNumber" attribute`, () => {
            // @ts-expect-error 002
            const numberSchema = TestModel.getAttributeSchema("aNumber");
            expect(numberSchema).to.have.property("isInternal", true);
        });

        it(`has an optional "aString" and "aBoolean" attribute`, () => {
            const attrs = ["aString", "aBoolean"] as const;
            for (const attr of attrs) {
                const schema = TestModel.getAttributeSchema(attr);
                expect(schema).not.to.be.undefined.and.not.to.be.null;
                expect(schema).to.have.property("isRequired", false);
            }
        });

        it(`has an immutable "aString" attribute`, () => {
            const stringSchema = TestModel.getAttributeSchema("aString");
            expect(stringSchema).to.have.property("isImmutable", true);
        });

        it(`should have generated an optional null type`, () => {
            // @ts-expect-error 002
            const schema = TestModel.getAttributeSchema("aNull");
            const type = schema?.getSchemaType() as ZodOptional<ZodNull>;
            expect(type).to.be.instanceOf(ZodOptional);
            expect(type._def.innerType).to.be.instanceOf(ZodNull);
        });

        it(`should have generated an optional boolean type`, () => {
            const schema = TestModel.getAttributeSchema("aBoolean");
            const type = schema?.getSchemaType() as ZodOptional<ZodBoolean>;
            expect(type).to.be.instanceOf(ZodOptional);
            expect(type._def.innerType).to.be.instanceOf(ZodBoolean);
        });

        it(`should have generated an optional string type`, () => {
            const schema = TestModel.getAttributeSchema("aString");
            expect(Boolean(schema?.parameters.isRequired)).to.be.false;
            expect(schema?.isRequired).to.be.false;

            const type = schema?.getSchemaType() as ZodOptional<ZodUnion<[ZodOptional<ZodUndefined>, ZodOptional<ZodString>]>>;
            expect(type).to.be.instanceOf(ZodOptional);
            expect(type._def.innerType).to.be.instanceOf(ZodString);
        });

        it(`should have generated a required number type`, () => {
            // @ts-expect-error 002
            const schema = TestModel.getAttributeSchema("aNumber");
            const type = schema?.getSchemaType() as ZodOptional<ZodString>;
            expect(type).to.be.instanceOf(ZodNumber);
        });

        it(`should have generated a required date type`, () => {
            const schema = TestModel.getAttributeSchema("aDate");
            const type = schema?.getSchemaType() as ZodOptional<ZodString>;
            expect(type).to.be.instanceOf(ZodDate);
        });

        it(`should have generated a required union type with string literal "Test" and number literal 42`, () => {
            const schema = TestModel.getAttributeSchema("anUnion");
            const type = schema?.getSchemaType() as ZodOptional<ZodUnion<[ZodOptional<ZodLiteral<"test">>, ZodOptional<ZodLiteral<42>>]>>;
            expect(type).to.be.instanceOf(ZodOptional);
            expect(type._def.innerType).to.be.instanceOf(ZodUnion);

            const innerType = type._def.innerType;
            expect(innerType.options[0]).to.be.instanceOf(ZodOptional);
            expect(innerType.options[0]._def.innerType).to.be.instanceOf(ZodLiteral);
            expect(innerType.options[0]._def.innerType.value).to.be.equal("Test");

            expect(innerType.options[1]).to.be.instanceOf(ZodOptional);
            expect(innerType.options[1]._def.innerType).to.be.instanceOf(ZodLiteral);
            expect(innerType.options[1]._def.innerType.value).to.be.equal(42);
        });

        it(`should have generated an required intersection type with TestMyTestModel & TestMyTesterModel`, () => {
            const schema = TestModel.getAttributeSchema("anIntersection");
            const type = schema?.getSchemaType() as ZodIntersection<ZodUnion<[ZodLazy<ZodObject<ZodRawShape>>, ZodEffects<ZodObject<ZodRawShape>>]>, ZodUnion<[ZodLazy<ZodObject<ZodRawShape>>, ZodEffects<ZodObject<ZodRawShape>>]>>;
            expect(type).to.be.instanceOf(ZodIntersection);

            let innerType = type._def.left;
            expect(innerType.options[0]).to.be.instanceOf(ZodLazy);
            expect(innerType.options[0].schema).to.be.instanceOf(ZodObject);
            expect(innerType.options[0].schema.shape).to.have.property("name");

            expect(innerType.options[1]).to.be.instanceOf(ZodEffects);

            innerType = type._def.right;
            expect(innerType.options[0]).to.be.instanceOf(ZodLazy);
            expect(innerType.options[0].schema).to.be.instanceOf(ZodObject);
            expect(innerType.options[0].schema.shape).to.have.property("name");

            expect(innerType.options[1]).to.be.instanceOf(ZodEffects);
        });

        it(`should have generated an required intersection type with ITestMyInterface & ITestMySecondInterface`, () => {
            const schema = TestModel.getAttributeSchema("anotherIntersection");
            const type = schema?.getSchemaType() as ZodIntersection<ZodLazy<ZodObject<ZodRawShape>>, ZodLazy<ZodObject<ZodRawShape>>>;
            expect(type).to.be.instanceOf(ZodIntersection);

            const innerTypes = [type._def.left, type._def.right];
            for (const innerType of innerTypes) {
                expect(innerType).to.be.instanceOf(ZodLazy);
                expect(innerType.schema).to.be.instanceOf(ZodObject);
                expect(innerType.schema.shape).to.have.all.keys(["prop1", "prop2", "prop3"]);
            }
        });

        it(`should have generated a required tuple type with string, number and optional boolean`, () => {
            const schema = TestModel.getAttributeSchema("aTuple");
            const type = schema?.getSchemaType() as ZodTuple<[ZodString, ZodNumber, ZodOptional<ZodBoolean>]>;
            expect(type).to.be.instanceOf(ZodTuple);
            expect(type.items).to.be.an.instanceOf(Array);
            expect(type.items[0]).to.be.an.instanceOf(ZodString);
            expect(type.items[1]).to.be.an.instanceOf(ZodNumber);
            expect(type.items[2]).to.be.an.instanceOf(ZodOptional);
            expect(type.items[2]._def.innerType).to.be.an.instanceOf(ZodBoolean);
        });

        it(`should have generated an required plain object type with member prop1: string and prop2?: number`, () => {
            const schema = TestModel.getAttributeSchema("anInterface");
            const type = schema?.getSchemaType() as ZodLazy<ZodObject<ZodRawShape>>;
            expect(type).to.be.instanceOf(ZodLazy);
            expect(type.schema).to.be.an.instanceOf(Object);
            expect(type.schema._def.shape()).to.include.all.keys(["prop1", "prop2"]);
            expect(type.schema._def.shape().prop1).to.be.an.instanceOf(ZodString);
            expect(type.schema._def.shape().prop2).to.be.an.instanceOf(ZodOptional);
            expect(type.schema._def.shape().prop2._def.innerType).to.be.an.instanceOf(ZodNumber);
        });

        it(`should have generated an required array type of strings`, () => {
            const schema = TestModel.getAttributeSchema("anArray");
            const type = schema?.getSchemaType() as ZodArray<ZodString, "many">;
            expect(type).to.be.instanceOf(ZodArray);
            expect(type._def.type).to.be.an.instanceOf(ZodString);
        });

        it(`should be an object like type`, () => {
            const objectLikeAttributes = ["anIntersection", "anInterface"] as const;

            for (const attributeName of objectLikeAttributes) {
                const schema = TestModel.getAttributeSchema(attributeName);
                const type = schema?.parameters.type;
                expect(type).not.to.be.undefined;
                expect(schema?.isObjectLikeType(type), `attribute: ${attributeName}, type: ${JSON.stringify(type)}`).to.be.true;
            }
        });

        it(`should be an unresolved type`, () => {
            const schema = TestModel.getAttributeSchema("anArray");
            expect(schema?.isUnresolvedType({ isUnresolved: true })).to.be.true;
            expect(schema?.isUnresolvedType({ isMixed: true })).to.be.true;
        });

        it(`should be a generated column`, () => {
            const schema = TestModel.getAttributeSchema("aGeneratedColumn");
            expect(Boolean(schema?.isGenerated)).to.be.true;
        });

        it(`should be a one to one relation`, async () => {
            const schema = TestModel.getAttributeSchema("oneToOne");
            expect(await schema?.getRelationType()).to.be.equal("OneToOne");
        });

        it(`should be a bidirectional one to one relation`, async () => {
            let schema = TestModel.getAttributeSchema("bidirectionalOneToOne");
            expect(await schema?.getRelationType()).to.be.equal("OneToOne");

            schema = TestMyTestModel.getAttributeSchema("bidirectionalOneToOne");
            expect(await schema?.getRelationType()).to.be.equal("OneToOne");
        });

        it(`should be a many to one relation`, async () => {
            const schema = TestModel.getAttributeSchema("manyToOne");
            expect(await schema?.getRelationType()).to.be.equal("ManyToOne");
        });

        it(`should be a one to many relation`, async () => {
            const schema = TestMyTestModel.getAttributeSchema("oneToMany");
            expect(await schema?.getRelationType()).to.be.equal("OneToMany");
        });

        it(`should be a many to many relation`, async () => {
            let schema = TestModel.getAttributeSchema("manyToMany");
            expect(await schema?.getRelationType()).to.be.equal("ManyToMany");

            schema = TestMyTestModel.getAttributeSchema("manyToMany");
            expect(await schema?.getRelationType()).to.be.equal("ManyToMany");
        });

        it(`should be no relation`, async () => {
            const schema = TestModel.getAttributeSchema("noRelation");
            expect(await schema?.getRelationType()).to.be.null;
        });

        it(`should have updated the parameters`, () => {
            const schema = TestModel.getAttributeSchema("noRelation");
            schema?.updateParameters({ isLazy: true });
            expect(schema?.isLazy).to.be.true;
        });

        it(`should validate correctly`, () => {
            const modelSchema = TestModel.getSchema();

            const inputs: Record<string, Record<"valid" | "invalid", any[]>> = {
                aBoolean: {
                    valid: [true, false, undefined],
                    invalid: [
                        null,
                        new Date(),
                        randGen.generateNumber(),
                        randGen.generateString(),
                        randGen.generateObject(),
                        randGen.generateArray()
                    ]
                },
                aString: {
                    valid: [undefined, randGen.generateString()],
                    invalid: [
                        null,
                        new Date(),
                        randGen.generateNumber(),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray()
                    ]
                },
                aDate: {
                    valid: [new Date()],
                    invalid: [
                        undefined,
                        null,
                        randGen.generateString(),
                        randGen.generateNumber(),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray()
                    ]
                },
                anUnion: {
                    valid: [undefined, "Test", 42],
                    invalid: [
                        null,
                        new Date(),
                        randGen.generateString(),
                        randGen.generateNumber({ max: 41 }),
                        randGen.generateNumber({ min: 43 }),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray()
                    ]
                },
                aUselessField: {
                    valid: [null, undefined],
                    invalid: [
                        new Date(),
                        randGen.generateString(),
                        randGen.generateNumber(),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray()
                    ]
                },
                anIntersection: {
                    valid: [
                        {
                            id: uuIdV4(),
                            created: new Date(),
                            modifiedAt: new Date(),
                            version: 1,
                            name: randGen.generateString()
                        }
                    ],
                    invalid: [
                        undefined,
                        null,
                        new Date(),
                        new TestMyTestModel({ name: randGen.generateString() }),
                        new TestMyTesterModel({ name: randGen.generateString() }),
                        randGen.generateString(),
                        randGen.generateNumber(),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray()
                    ]
                },
                anotherIntersection: {
                    valid: [
                        {
                            prop1: randGen.generateString(),
                            prop2: randGen.generateArray({ valTypes: ["number"] }),
                            prop3: randGen.generateBoolean()
                        }
                    ],
                    invalid: [
                        undefined,
                        null,
                        {
                            prop1: randGen.generateString(),
                            prop2: randGen.generateNumber(),
                            prop3: randGen.generateBoolean()
                        },
                        {
                            prop1: randGen.generateString(),
                            prop3: randGen.generateBoolean()
                        },
                        new Date(),
                        randGen.generateString(),
                        randGen.generateNumber(),
                        randGen.generateBoolean(),
                        randGen.generateObject(), // Might be valid...
                        randGen.generateArray()
                    ]
                },
                aTuple: {
                    valid: [[randGen.generateString(), randGen.generateNumber(), randGen.generateBoolean()], [randGen.generateString(), randGen.generateNumber()]],
                    invalid: [
                        undefined,
                        null,
                        [randGen.generateString()],
                        [randGen.generateString(), randGen.generateNumber(), null],
                        [undefined, null, null],
                        new Date(),
                        randGen.generateString(),
                        randGen.generateNumber(),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray() // Might be valid...
                    ]
                },
                anArray: {
                    valid: [randGen.generateArray({ valTypes: ["string"] })],
                    invalid: [
                        undefined,
                        null,
                        new Date(),
                        randGen.generateString(),
                        randGen.generateNumber(),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray({ valTypes: ["number", "boolean", "object", "array"], minLength: 1 })
                    ]
                },
                aNumber: {
                    valid: [randGen.generateNumber()],
                    invalid: [
                        undefined,
                        null,
                        new Date(),
                        randGen.generateString(),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray()
                    ]
                },
                anInterface: {
                    valid: [
                        { prop1: randGen.generateString() },
                        { prop1: randGen.generateString(), prop2: randGen.generateNumber() }
                    ],
                    invalid: [
                        undefined,
                        null,
                        new Date(),
                        randGen.generateString(),
                        randGen.generateNumber(),
                        randGen.generateBoolean(),
                        randGen.generateObject(),
                        randGen.generateArray()
                    ]
                }
            };

            for (const attrName in inputs) {
                if (hasOwnProperty(inputs, attrName)) {
                    const attributeSchema = modelSchema?.attributeSchemas[attrName];
                    const possibleInputs = inputs[attrName];
                    for (const valid of possibleInputs.valid) {
                        expect(attributeSchema?.validate(valid), `attribute ${attrName}, value ${JSON.stringify(valid)}`).to.be.true;
                    }
                    for (const invalid of possibleInputs.invalid) {
                        expect(attributeSchema?.validate(invalid), `attribute ${attrName}, value ${JSON.stringify(invalid)}`).to.be.instanceOf(AggregateError);
                    }
                }
            }
        });
    });
}
