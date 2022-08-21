import { expect } from "chai";
import { ZodObject, ZodType, ZodLazy, ZodString, ZodOptional, ZodNumber, ZodDate, ZodBoolean } from "zod";
import AttributeSchema from "~client/lib/AttributeSchema";
import BaseModel from "~client/lib/BaseModel";
import ModelSchema from "~client/lib/ModelSchema";
import { Model, Attr } from "~client/utils/decorators";
import type { IAttrMetadata } from "~client/@types/MetadataTypes";

/*
    Error expectation codes:
        - 001: because we are using mocks here, we have to pass a normally unaccessible property
*/

const className = "TestModel";
const collectionName = "TestModels";

const attributesToExpect = ["aBoolean", "aString", "aNumber", "aDate"] as const;
const atLeastAttributesText = `At least: "${attributesToExpect.join("\", \"")}"`;

const typeMap: Record<string, IAttrMetadata["type"]> = {
    aBoolean: { identifier: "Boolean" },
    aString: { identifier: "String" },
    aNumber: { identifier: "Number" },
    aDate: { identifier: "Date" }
};

function createMetadataJson(name: keyof typeof typeMap, isRequired = false, isInternal = false, isReadOnly = false, isLazy = false) {
    return JSON.stringify({ name, isInternal, isReadOnly, isRequired, isLazy, type: typeMap[name] });
}

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
}

const MODEL_NAME_TO_MODEL_MAP = { TestModel };
if (window.MODEL_NAME_TO_MODEL_MAP) {
    Object.assign(window.MODEL_NAME_TO_MODEL_MAP, MODEL_NAME_TO_MODEL_MAP);
} else window.MODEL_NAME_TO_MODEL_MAP = MODEL_NAME_TO_MODEL_MAP;

describe('decorators', () => {
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
    });

});
