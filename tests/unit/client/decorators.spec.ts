import { expect } from "chai";
import { ZodObject, ZodType, ZodLazy, ZodString, ZodOptional, ZodNumber, ZodDate, ZodBoolean, ZodUnion, ZodLiteral, ZodIntersection, ZodEffects, ZodTuple, ZodUndefined, ZodNull, ZodArray } from "zod";
import AttributeSchema from "~client/lib/AttributeSchema";
import BaseModel from "~client/lib/BaseModel";
import ModelSchema from "~client/lib/ModelSchema";
import { Model, Attr } from "~client/utils/decorators";
import type { ZodRawShape } from "zod";
import type { IAttrMetadata } from "~client/@types/MetadataTypes";

/*
    Error expectation codes:
        - 001: because we are using mocks here, we have to pass a normally unaccessible property
*/

const className = "TestModel";
const collectionName = "TestModels";

const attributesToExpect = ["aBoolean", "aString", "aNumber", "aDate"] as const;
const atLeastAttributesText = `At least: "${attributesToExpect.join("\", \"")}"`;

interface IMyInterface {
    prop1: string;
    prop2?: number;
}

const typeMap: Record<string, IAttrMetadata["type"]> = {
    aBoolean: { identifier: "Boolean" },
    aString: { identifier: "String" },
    aNumber: { identifier: "Number" },
    aDate: { identifier: "Date" },
    anUnion: {
        isUnion: true,
        subTypes: [
            { isLiteral: true, isStringLiteral: true, value: "Test" },
            { isLiteral: true, isNumberLiteral: true, value: 42 }
        ]
    },
    anIntersection: {
        isIntersection: true,
        subTypes: [{
            isModel: true,
            identifier: "MyTestModel"
        }, {
            isModel: true,
            identifier: "MyTesterModel"
        }]
    },
    aTuple: {
        isTuple: true,
        subTypes: [
            { isUndefined: true },
            { isNull: true },
            { isOptional: true, subType: { identifier: "Boolean" } }
        ]
    },
    anInterface: {
        isInterface: true,
        members: {
            prop1: {
                isInternal: false,
                isLazy: false,
                isReadOnly: false,
                isRequired: true,
                name: "prop1",
                type: { identifier: "String" }
            },
            prop2: {
                isInternal: false,
                isLazy: false,
                isReadOnly: false,
                isRequired: false,
                name: "prop2",
                type: { isOptional: true, subType: { identifier: "Number" } }
            }
        }
    },
    anArray: {
        isArray: true,
        subType: { identifier: "String" }
    }
};

function createMetadataJson(name: keyof typeof typeMap, isRequired = false, isInternal = false, isReadOnly = false, isLazy = false) {
    return JSON.stringify({ name, isInternal, isReadOnly, isRequired, isLazy, type: typeMap[name] });
}

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className: "MyTestModel", collectionName: "MyTestModels", isAbstract: false }) })
class MyTestModel extends BaseModel { }

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className: "MyTesterModel", collectionName: "MyTesterModels", isAbstract: false }) })
class MyTesterModel extends BaseModel { }

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className, collectionName, isAbstract: true }) })
abstract class AbstractTest extends BaseModel { }

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className, collectionName, isAbstract: false }) })
class TestModel extends AbstractTest {

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aBoolean") })
    public aBoolean: boolean = true;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aString", false, false, true) })
    public readonly aString?: string;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aNumber", true, true) })
    public aNumber!: number; // This normally has to be at least protected because it's marked as "isInternal"

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aDate", true) })
    public aDate!: Date;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("anUnion", false) })
    public anUnion: "Test" | 42 = 42;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("anIntersection", true) })
    public anIntersection!: MyTestModel & MyTesterModel;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aTuple", true) })
    public aTuple!: [undefined, null, boolean?];

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("anInterface", true) })
    public anInterface!: IMyInterface;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("anArray", true) })
    public anArray!: string[];
}

describe('decorators', () => {
    before("register models", () => {
        const MODEL_NAME_TO_MODEL_MAP = { BaseModel, TestModel, MyTestModel, MyTesterModel };
        if (global.MODEL_NAME_TO_MODEL_MAP) {
            Object.assign(global.MODEL_NAME_TO_MODEL_MAP, MODEL_NAME_TO_MODEL_MAP);
        } else global.MODEL_NAME_TO_MODEL_MAP = MODEL_NAME_TO_MODEL_MAP;
    });

    describe('Model', () => {
        it('should give a model a className', () => {
            expect(TestModel.className).to.be.equal(className);
            const testModel = new TestModel();
            expect(testModel.className).to.be.equal(className);
        });

        it('should give a model a collectionName', () => {
            expect(TestModel.collectionName).to.be.equal(collectionName);
            const testModel = new TestModel();
            expect(testModel.collectionName).to.be.equal(collectionName);
        });

        it('should have generated a schema', () => {
            const model = new TestModel();

            let schema = TestModel.getSchema();
            expect(schema).to.be.instanceOf(ModelSchema);

            schema = model.getSchema();
            expect(schema).to.be.instanceOf(ModelSchema);
        });

        it('should gave the schema the decorated class as owner', () => {
            const schema = TestModel.getSchema();
            expect(schema?.owner).to.be.equal(TestModel);
        });

        it('should reflect the passed options in the schema', () => {
            const schema = TestModel.getSchema();
            expect(schema?.modelName).to.be.equal(className);
            expect(schema?.collectionName).to.be.equal(collectionName);
            expect(schema?.isAbstract).to.be.equal(false);

            expect(schema?.options.className).to.be.equal(className);
            expect(schema?.options.collectionName).to.be.equal(collectionName);
            expect(schema?.options.isAbstract).to.be.equal(false);
            expect(schema?.options.database).to.be.equal(undefined);
            expect(schema?.options.engine).to.be.equal(undefined);
            expect(schema?.options.indexes).to.be.equal(undefined);
            expect(schema?.options.orderBy).to.be.equal(undefined);
            expect(schema?.options.schema).to.be.equal(undefined);
            expect(schema?.options.withoutRowid).to.be.equal(undefined);
        });

        it(`should have collected the attribute schemas. ${atLeastAttributesText}`, () => {
            const schema = TestModel.getSchema() as unknown as ModelSchema<typeof TestModel>;
            for (const expectedAttributeName of attributesToExpect) {
                const attributeSchema = schema?.getAttributeSchema(expectedAttributeName);
                expect(attributeSchema).to.be.instanceOf(AttributeSchema);
            }
        });

        it(`should have have built the schema type containing defined Attributes. ${atLeastAttributesText}`, () => {
            const schema = TestModel.getSchema() as unknown as ModelSchema<typeof TestModel>;

            const schemaType = schema.getSchemaType();
            expect(schemaType).to.be.instanceOf(ZodLazy);

            const zodType = schemaType._def.getter();
            expect(zodType).to.be.instanceOf(ZodObject);

            for (const expectedAttributeName of attributesToExpect) {
                expect(zodType.shape[expectedAttributeName]).to.be.instanceOf(ZodType);
            }
        });
    });

    describe('Attr', () => {
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

        it(`should have generated an optional boolean type`, () => {
            const schema = TestModel.getAttributeSchema("aBoolean");
            const type = schema?.getSchemaType() as ZodOptional<ZodBoolean>;
            expect(type).to.be.instanceOf(ZodOptional);
            expect(type._def.innerType).to.be.instanceOf(ZodBoolean);
        });

        it(`should have generated an optional string type`, () => {
            const schema = TestModel.getAttributeSchema("aString");
            const type = schema?.getSchemaType() as ZodOptional<ZodString>;
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

        it(`should have generated an required intersection type with MyTestModel & MyTesterModel`, () => {
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

        it(`should have generated a required tuple type with undefined, null and optional boolean`, () => {
            const schema = TestModel.getAttributeSchema("aTuple");
            const type = schema?.getSchemaType() as ZodTuple<[ZodUndefined, ZodNull, ZodOptional<ZodBoolean>]>;
            expect(type).to.be.instanceOf(ZodTuple);
            expect(type.items).to.be.an.instanceOf(Array);
            expect(type.items[0]).to.be.an.instanceOf(ZodUndefined);
            expect(type.items[1]).to.be.an.instanceOf(ZodNull);
            expect(type.items[2]).to.be.an.instanceOf(ZodOptional);
            expect(type.items[2]._def.innerType).to.be.an.instanceOf(ZodBoolean);
        });

        it(`should have generated an required plain object type with member prop1: string and prop2?: number`, () => {
            const schema = TestModel.getAttributeSchema("anInterface");
            const type = schema?.getSchemaType() as ZodObject<ZodRawShape>;
            expect(type).to.be.instanceOf(ZodObject);
            expect(type._def.shape()).to.be.an.instanceOf(Object);
            expect(type._def.shape()).to.include.all.keys(["prop1", "prop2"]);
            expect(type._def.shape().prop1).to.be.an.instanceOf(ZodString);
            expect(type._def.shape().prop2).to.be.an.instanceOf(ZodOptional);
            expect(type._def.shape().prop2._def.innerType).to.be.an.instanceOf(ZodNumber);
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
                expect(schema?.isObjectLikeType(type)).to.be.true;
            }
        });

        it(`should be an unresolved type`, () => {
            const schema = TestModel.getAttributeSchema("anArray");
            expect(schema?.isUnresolvedType({ isUnresolvedType: true })).to.be.true;
            expect(schema?.isUnresolvedType({ isMixed: true })).to.be.true;
        });
    });

});
