import { expect } from "chai";
import { ZodObject, ZodType, ZodLazy } from "zod";
import AttributeSchema from "~env/lib/AttributeSchema";
import ModelSchema from "~env/lib/ModelSchema";
import TestModel from "~env/models/TestModel";

const attributesToExpect = ["aBoolean", "aString", "aNumber", "aDate"] as const;
const atLeastAttributesText = `At least: "${attributesToExpect.join("\", \"")}"`;

export default function (_environment = "common") {
    describe('ModelSchema', () => {
        it('should give a model a className', () => {
            expect(TestModel.className).to.be.equal("TestModel");
            const testModel = new TestModel();
            expect(testModel.className).to.be.equal("TestModel");
        });

        it('should give a model a collectionName', () => {
            expect(TestModel.collectionName).to.be.equal("testModels");
            const testModel = new TestModel();
            expect(testModel.collectionName).to.be.equal("testModels");
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
            expect(schema?.modelName).to.be.equal("TestModel");
            expect(schema?.collectionName).to.be.equal("testModels");
            expect(schema?.isAbstract).to.be.equal(false);

            expect(schema?.options.className).to.be.equal("TestModel");
            expect(schema?.options.collectionName).to.be.equal("testModels");
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
                // @ts-expect-error 002
                const attributeSchema = schema?.getAttributeSchema(expectedAttributeName);
                expect(attributeSchema, `AttributeName "${expectedAttributeName}"`).to.be.instanceOf(AttributeSchema);
            }
        });

        it(`should have have built the schema type containing defined Attributes. ${atLeastAttributesText}`, () => {
            const schema = TestModel.getSchema() as unknown as ModelSchema<typeof TestModel>;

            const schemaType = schema.getSchemaType();
            expect(schemaType).to.be.instanceOf(ZodLazy);

            const zodType = schemaType._def.getter();
            expect(zodType).to.be.instanceOf(ZodObject);

            for (const expectedAttributeName of attributesToExpect) {
                expect(zodType.shape[expectedAttributeName], `AttributeName "${expectedAttributeName}"`).to.be.instanceOf(ZodType);
            }
        });
    });
}
