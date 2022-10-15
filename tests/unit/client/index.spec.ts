
import BaseModel from "~client/lib/BaseModel";
import TestModel from "~client/models/TestModel";
import TestMyTestModel from "~client/models/TestMyTestModel";
import TestMyTesterModel from "~client/models/TestMyTesterModel";
import AttributeSchemaSpec from "~client/tests/AttributeSchema.spec";
import ModelSchemaSpec from "~client/tests/ModelSchema.spec";
import CommonSpec from "~common/index.spec";

describe("Tests", () => {
    before("register models", async () => {
        const MODEL_NAME_TO_MODEL_MAP = { BaseModel, TestModel, TestMyTestModel, TestMyTesterModel };
        if (global.MODEL_NAME_TO_MODEL_MAP) {
            Object.assign(global.MODEL_NAME_TO_MODEL_MAP, MODEL_NAME_TO_MODEL_MAP);
        } else global.MODEL_NAME_TO_MODEL_MAP = MODEL_NAME_TO_MODEL_MAP;
        const modelClasses = Object.values(MODEL_NAME_TO_MODEL_MAP);
        await Promise.all(modelClasses.map((modelClass) => modelClass.getSchema()?.awaitConstruction()));
    });

    CommonSpec("client");

    describe("Client", () => {
        ModelSchemaSpec();
        AttributeSchemaSpec();
    });
});
