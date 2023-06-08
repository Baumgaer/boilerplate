import { expect } from "chai";
// @ts-expect-error there are no type definitions
import * as randGen from "random-input-generator";
import { v4 as uuIdV4 } from "uuid";
import { ZodObject, ZodLazy, ZodString, ZodOptional, ZodNumber, ZodDate, ZodBoolean, ZodUnion, ZodLiteral, ZodTuple, ZodArray, ZodNull } from "zod";
import { embeddedEntityFactory } from "~common/lib/EmbeddedEntity";
import ModelSchema from "~env/lib/ModelSchema";
import TestModel from "~env/models/TestModel";
import TestMyTestModel from "~env/models/TestMyTestModel";
import TestMyTesterModel from "~env/models/TestMyTesterModel";
import { hasOwnProperty, upperFirst } from "~env/utils/utils";
import type { ZodRawShape, ZodUndefined } from "zod";

export default function (environment = "common") {
    describe('AttributeSchema', () => {
        it(`has a primary id column`, () => {
            const schema = TestModel.getAttributeSchema("id");
            expect(schema).not.to.be.undefined.and.not.to.be.null;
            expect(schema).to.have.property("primary", true);
            expect(schema).to.have.property("validator", "UUID");

            const schemaType = schema?.getSchemaType() as ZodOptional<ZodString> | undefined;
            expect(schemaType).not.to.be.undefined.and.not.to.be.null;
            expect(schemaType).to.be.instanceOf(ZodOptional);
            expect(schemaType?.unwrap()).to.be.instanceOf(ZodString);
            expect(schemaType?.unwrap().isUUID).to.be.true;
        });

        it(`has an required "aDate" and "aNumber" attribute`, () => {
            const attrs = ["aDate", "aNumber"] as const;
            for (const attr of attrs) {
                const schema = TestModel.getAttributeSchema(attr);
                expect(schema).not.to.be.undefined.and.not.to.be.null;
                expect(schema).to.have.property("isRequired", true);
            }
        });

        it(`has an internal "aNumber" attribute`, () => {
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
            expect(Boolean(schema?.options.isRequired)).to.be.false;
            expect(schema?.isRequired).to.be.false;

            const type = schema?.getSchemaType() as ZodOptional<ZodUnion<[ZodOptional<ZodUndefined>, ZodOptional<ZodString>]>>;
            expect(type).to.be.instanceOf(ZodOptional);
            expect(type._def.innerType).to.be.instanceOf(ZodString);
        });

        it(`should have generated a required number type`, () => {
            const schema = TestModel.getAttributeSchema("aNumber");
            const type = schema?.getSchemaType() as ZodOptional<ZodString>;
            expect(type).to.be.instanceOf(ZodNumber);
        });

        it(`should have generated a required date type`, () => {
            const schema = TestModel.getAttributeSchema("aDate");
            const type = schema?.getSchemaType() as ZodUnion<[ZodDate, ZodString]>;
            expect(type).to.be.instanceOf(ZodUnion);
            expect(type._def.options[0]).to.be.instanceOf(ZodDate);
            expect(type._def.options[1]).to.be.instanceOf(ZodString);
        });

        it(`should have generated a optional union type with string literal "Test" and number literal 42`, () => {
            const schema = TestModel.getAttributeSchema("anUnion");
            const type = schema?.getSchemaType() as ZodOptional<ZodUnion<[ZodLiteral<"test">, ZodLiteral<42>]>>;
            expect(type).to.be.instanceOf(ZodOptional);
            expect(type._def.innerType).to.be.instanceOf(ZodUnion);

            const innerType = type._def.innerType;
            expect(innerType.options[0]).to.be.instanceOf(ZodLiteral);
            expect(innerType.options[0].value).to.be.equal("Test");

            expect(innerType.options[1]).to.be.instanceOf(ZodLiteral);
            expect(innerType.options[1].value).to.be.equal(42);
        });

        it(`should have generated an optional intersection type with TestMyTestModel & TestMyTesterModel`, () => {
            const schema = TestModel.getAttributeSchema("anIntersection");
            const type = schema?.getSchemaType() as ZodOptional<ZodObject<any>>;
            expect(type).to.be.instanceOf(ZodOptional);

            const obj = type.unwrap();
            expect(obj).to.be.instanceOf(ZodObject);
            expect(obj.shape).to.have.all.keys([
                "id",
                "createdAt",
                "modifiedAt",
                "deletedAt",
                "version",
                "name",
                "veryUnique",
                "bidirectionalOneToOne",
                "oneToMany",
                "manyToMany"
            ]);
        });

        it(`should have generated an required intersection type with ITestMyInterface & ITestMySecondInterface`, () => {
            const schema = TestModel.getAttributeSchema("anotherIntersection");
            const type = schema?.getSchemaType() as ZodObject<ZodRawShape>;
            expect(type).to.be.instanceOf(ZodObject);
            expect(type.shape).to.have.all.keys(["prop1", "prop2", "prop3"]);
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

        it(`should be an embedded entity`, () => {
            const className = `${upperFirst(environment)}TestModelAnInterfaceEmbeddedEntity`;

            class FakeClass {
                public className: string = className;
            }

            class AnotherFakeClass extends FakeClass {

                public getSchema() {
                    return {
                        attributeSchemas: {
                            prop1: "test"
                        }
                    };
                }
            }

            const schema = TestModel.getAttributeSchema("anInterface");
            // @ts-expect-error 002
            const embeddedEntityClass = schema?.embeddedEntity as ReturnType<typeof embeddedEntityFactory>;
            const commonEmbeddedEntityClass = embeddedEntityFactory(className, {
                prop1: { name: "prop1", isRequired: true, isLazy: false, type: { identifier: "String", isPrimitive: true } },
                prop2: { name: "prop2", isRequired: false, isLazy: false, type: { identifier: "Number", isPrimitive: true } }
            }, true);
            const instance = new commonEmbeddedEntityClass({ prop1: "test" });

            expect(embeddedEntityClass).to.be.an.instanceOf(commonEmbeddedEntityClass);
            expect(new AnotherFakeClass()).to.be.an.instanceOf(commonEmbeddedEntityClass);
            expect("test").not.to.be.an.instanceOf(commonEmbeddedEntityClass);
            expect({ prop1: "test" }).not.to.be.an.instanceOf(commonEmbeddedEntityClass);
            expect(TestModel).not.to.be.an.instanceOf(commonEmbeddedEntityClass);
            expect(new FakeClass()).not.to.be.an.instanceOf(commonEmbeddedEntityClass);
            expect(instance.getSchema()).to.be.an.instanceOf(ModelSchema);
            expect(instance.isNew()).to.be.true;
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
                const type = schema?.options.type;
                expect(type).not.to.be.undefined;
                expect(schema?.isObjectLikeType(type), `attribute: ${attributeName}, type: ${JSON.stringify(type)}`).to.be.true;
            }
        });

        it(`should be an unresolved type`, () => {
            const schema = TestModel.getAttributeSchema("anArray");
            expect(schema?.isUnresolvedType({ isUnresolved: true, isMixed: true })).to.be.true;
            expect(schema?.isUnresolvedType({ isMixed: true, isUnresolved: false })).to.be.false;
        });

        it(`should be an any type`, () => {
            const schema = TestModel.getAttributeSchema("anArray");
            expect(schema?.isAnyType({ isUnresolved: true, isMixed: true })).to.be.false;
            expect(schema?.isAnyType({ isMixed: true, isUnresolved: false })).to.be.true;
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
            schema?.updateOptions({ isLazy: true });
            expect(schema?.isLazy).to.be.true;
        });

        it(`should use every time its own raw type`, () => {
            let schema = TestModel.getAttributeSchema("aBoolean");
            expect(schema?.isArrayType()).to.be.false;
            expect(schema?.isBooleanType()).to.be.true;
            expect(schema?.isCustomType()).to.be.false;
            expect(schema?.isDateType()).to.be.false;
            expect(schema?.isIntersectionType()).to.be.false;
            expect(schema?.isUnionType()).to.be.false;
            expect(schema?.isLiteralType()).to.be.false;
            expect(schema?.isModelType()).to.be.false;
            expect(schema?.isNullType()).to.be.false;
            expect(schema?.isNumberType()).to.be.false;
            expect(schema?.isObjectLikeType()).to.be.false;
            expect(schema?.isOptionalType()).to.be.false;
            expect(schema?.isPlainObjectType()).to.be.false;
            expect(schema?.isStringType()).to.be.false;
            expect(schema?.isTupleType()).to.be.false;
            expect(schema?.isUndefinedType()).to.be.false;
            expect(schema?.isUnresolvedType()).to.be.false;

            expect(schema?.hasIdentifier()).to.be.true;
            expect(schema?.getUnionTypeValues().length).to.be.equal(0);

            schema = TestModel.getAttributeSchema("aTuple");
            expect(schema?.getTypeIdentifier()).to.be.equal("String");
        });

        it(`should not have a relation type`, async () => {
            const schema = TestModel.getAttributeSchema("aBoolean");
            expect(await schema?.getRelationType()).to.be.null;
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
                            name: randGen.generateString(),
                            veryUnique: "Test"
                        }
                    ],
                    invalid: [
                        null,
                        new Date(),
                        new TestMyTestModel({ name: randGen.generateString() }),
                        // @ts-expect-error this must be an invalid initialization
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
                            prop2: randGen.generateNumber(),
                            prop3: randGen.generateBoolean()
                        }
                    ],
                    invalid: [
                        undefined,
                        null,
                        {
                            prop1: randGen.generateString(),
                            prop2: randGen.generateArray(),
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
                        undefined, // Wrong type
                        null, // Wrong type
                        [randGen.generateString(), randGen.generateNumber(), null], // Wrong item Type (null)
                        [undefined, null, null], // Wrong item types
                        new Date(), // Wrong type
                        randGen.generateString(), // Wrong type
                        randGen.generateNumber(), // Wrong type
                        randGen.generateBoolean(), // Wrong type
                        randGen.generateObject(), // Wrong type
                        ["3xvp$*d", 6990, true, [ // Test for issue #40
                            { "qlkd": 5258, "vqph": { "zxzs": 697 }, "ylmr": [5891, 6979, "Gz;S*NZ"], "kzkfl": "*hDj7`>M", "dvxeke": true },
                            [{ "mfbzma": [1850, "EvLBoe0XZmp"], "qmzkfz": "<4/?/u*" }], "r**xV"]
                        ],
                        randGen.generateArray({ minLength: 4, templateArray: [randGen.generateString(), randGen.generateNumber(), randGen.generateBoolean()] }), // Too long
                        randGen.generateArray({ maxLength: 1 }), // Too short
                        ...(() => { // wrong item types with correct length
                            const allowed2 = JSON.stringify(["generateString", "generateNumber"]);
                            const allowed3 = JSON.stringify(["generateString", "generateNumber", "generateBoolean"]);
                            const types = ["generateString", "generateNumber", "generateBoolean", "generateObject", "generateArray", "Date"];
                            const failingResults: any[] = [];
                            for (const len of [2, 3]) {
                                for (const position1 of types) {
                                    for (const position2 of types) {
                                        if (len === 2) {
                                            const failingSchema = [position1, position2];
                                            if (JSON.stringify(failingSchema) === allowed2) continue;
                                            failingResults.push([
                                                position1.startsWith("generate") ? randGen[position1]() : new Date(),
                                                position2.startsWith("generate") ? randGen[position2]() : new Date()
                                            ]);
                                        } else {
                                            for (const position3 of types) {
                                                const failingSchema = [position1, position2, position3];
                                                if (JSON.stringify(failingSchema) === allowed3) continue;
                                                failingResults.push([
                                                    position1.startsWith("generate") ? randGen[position1]() : new Date(),
                                                    position2.startsWith("generate") ? randGen[position2]() : new Date(),
                                                    position3.startsWith("generate") ? randGen[position3]() : new Date()
                                                ]);
                                            }
                                        }
                                    }
                                }
                            }
                            return failingResults;
                        })()
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

            try {
                for (const attrName in inputs) {
                    if (hasOwnProperty(inputs, attrName)) {
                        const attributeSchema = modelSchema?.attributeSchemas[attrName];
                        const possibleInputs = inputs[attrName];
                        for (const valid of possibleInputs.valid) {
                            expect(attributeSchema?.validate(valid).success, `attribute ${attrName}, value ${JSON.stringify(valid)}`).to.be.true;
                        }
                        for (const invalid of possibleInputs.invalid) {
                            expect(attributeSchema?.validate(invalid).success, `attribute ${attrName}, value ${JSON.stringify(invalid)}`).to.be.false;
                        }
                    }
                }
            } catch (error) {
                debugger;
            }
        });
    });
}
