import AttributeSchemaSpec from "~common/tests/AttributeSchema.spec";
import ModelSchemaSpec from "~common/tests/ModelSchema.spec";

export default function () {
    describe("Common", () => {
        ModelSchemaSpec();
        AttributeSchemaSpec();
    });
}
