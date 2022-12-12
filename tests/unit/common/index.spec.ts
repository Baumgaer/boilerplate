import ActionSchemaSpec from "~common/tests/ActionSchema.spec";
import ArgumentSchemaSpec from "~common/tests/ArgumentSchema.spec";
import AttributeSchemaSpec from "~common/tests/AttributeSchema.spec";
import BaseAttributeSpec from "~common/tests/BaseAttribute.spec";
import ConfiguratorSpec from "~common/tests/Configurator.spec";
import DatatypesSpec from "~common/tests/Datatypes.spec";
import ModelInstance from "~common/tests/ModelInstance.spec";
import ModelSchemaSpec from "~common/tests/ModelSchema.spec";

export default function (environment = "common") {
    describe("Common", () => {
        ConfiguratorSpec(environment);
        DatatypesSpec(environment);
        AttributeSchemaSpec(environment);
        ModelSchemaSpec(environment);
        BaseAttributeSpec(environment);
        ModelInstance(environment);
        ActionSchemaSpec(environment);
        ArgumentSchemaSpec(environment);
    });
}
