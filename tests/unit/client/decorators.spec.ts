import { expect } from "chai";
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

function createMetadataJson(name: string, type: IAttrMetadata["type"], isInternal = false, isReadOnly = false, isRequired = false, isLazy = false) {
    return JSON.stringify({ name, isInternal, isReadOnly, isRequired, isLazy, type });
}

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className, collectionName, isAbstract: false }) })
class TestModel extends BaseModel {

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aBoolean", { identifier: "Boolean" }) })
    public aBoolean: boolean = true;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aString", { identifier: "String" }) })
    public aString: string = "test";

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aNumber", { identifier: "Number" }) })
    public aNumber: number = 1;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aDate", { identifier: "Date" }) })
    public aDate: Date = new Date();
}

window.MODEL_NAME_TO_MODEL_MAP = { TestModel };

const attributesToExpect = ["aBoolean", "aString", "aNumber", "aDate"] as const;
const atLeastAttributesText = `At least: "${attributesToExpect.join("\", \"")}"`;

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
    });

    describe('Attr', () => {
        it(`should contain attributes. ${atLeastAttributesText}`, () => {
            for (const expectedAttributeName of attributesToExpect) {
                const aBooleanAttr = TestModel.getAttributeSchema(expectedAttributeName);
                expect(aBooleanAttr).to.be.instanceOf(AttributeSchema);
            }
        });
    });

});
