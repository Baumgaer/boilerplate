import AttributeSchemaSpec from "~common/tests/AttributeSchema.spec";
import BaseAttributeSpec from "~common/tests/BaseAttribute.spec";
import ModelInstance from "~common/tests/ModelInstance.spec";
import ModelSchemaSpec from "~common/tests/ModelSchema.spec";

export default function (environment = "common") {
    describe("Common", () => {
        ModelSchemaSpec(environment);
        AttributeSchemaSpec(environment);
        BaseAttributeSpec(environment);
        ModelInstance(environment);
    });
}
